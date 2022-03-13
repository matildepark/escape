import React, { ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router';
import _ from 'lodash';
import { FaFolder, FaFolderOpen } from 'react-icons/fa';
import { Associations, Timebox } from '@urbit/api';
import { Box, Icon } from '@tlon/indigo-react';

import useGraphState, { useInbox } from '~/logic/state/graph';
import useHarkState from '~/logic/state/hark';
import { getFeedPath, getResourcePath, modulo } from '~/logic/lib/util';
import useMetadataState from '~/logic/state/metadata';
import { useShortcut } from '~/logic/state/settings';
import useGroupState from '~/logic/state/group';
import useInviteState from '~/logic/state/invite';
import { IS_MOBILE } from '~/logic/lib/platform';
import { roleForShip } from '~/logic/lib/group';
import { useDark } from '~/logic/state/join';
import { Workspace } from '~/types/workspace';
import { getGraphUnreads } from '~/views/apps/launch/components/Groups';
import { SidebarListConfig } from './types';
import { dmUnreads, getItems, sidebarSort } from './util';
import { GroupFolder } from './SidebarGroupSorter';
import { SidebarAssociationItem, SidebarDmItem, SidebarItemBase, SidebarPendingItem } from './SidebarItem';

const getHasNotification = (associations: Associations, group: string, unseen: Timebox) => {
  let hasNotification = false;
  for (const key in unseen) {
    const formattedKey = key.replace('landscape/graph', '/ship').replace('/mention', '');
    if (associations.graph[formattedKey]?.group === group) {
      hasNotification = true;
      break;
    }
  }
  return hasNotification;
};

export function SidebarGroup({ baseUrl, selected, config, workspace, title }: {
  config: SidebarListConfig;
  baseUrl: string;
  selected?: string;
  title?: string;
  workspace: Workspace;
}): ReactElement {
  const groupRef = useRef<HTMLElement>(null);
  const isMessages = workspace.type === 'messages';
  const isHome = workspace.type === 'home';
  const isGroup = workspace.type === 'group';
  const groupSelected =
    (isMessages && baseUrl.includes('messages')) ||
    (isHome && baseUrl.includes('home')) ||
    (workspace.type === 'group' && (baseUrl.replace('/~landscape', '') === workspace.group || baseUrl.includes(`${workspace.group}/resource`)));
  const [collapsed, setCollapsed] = useState(!groupSelected && !isMessages);

  useEffect(() => {
    if (isGroup && groupSelected && groupRef.current) {
      groupRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isGroup, groupSelected, groupRef]);

  const { associations } = useMetadataState();
  const { groups } = useGroupState();
  const inbox = useInbox();
  const pendingDms = useGraphState(s => [...s.pendingDms].map(s => `~${s}`));
  const graphKeys = useGraphState(s => s.graphKeys);
  const pendingGroupChats = useGroupState(s => _.pickBy(s.pendingJoin, (req, rid) => !(rid in groups) && req.app === 'graph'));
  const inviteGroupChats = useInviteState(
    s => Object.values(s.invites?.['graph'] || {})
    .map(inv => `/ship/~${inv.resource.ship}/${inv.resource.name}`).filter(group => !(group in groups))
  );
  const pending = [...pendingDms, ...Object.keys(pendingGroupChats), ...inviteGroupChats];
  const { unreads, unseen } = useHarkState();

  const ordered = getItems(associations, workspace, inbox, pending)
    .sort(sidebarSort(unreads, pending)[config.sortBy]);

  const history = useHistory();

  const cycleChannels = useCallback((backward: boolean) => {
    const idx = ordered.findIndex(s => s === selected);
    const offset = backward ? -1 : 1;

    const newIdx = modulo(idx+offset, ordered.length - 1);
    const newChannel = ordered[newIdx];
    let path = '';
    if(newChannel.startsWith('~')) {
      path = `/~landscape/messages/dm/${newChannel}`;
    } else {
      const association = associations.graph[ordered[newIdx]];
      if(!association) {
        path = '/~landscape/messages';
        return;
      } else {
        const { metadata, resource } = association;
        const joined = graphKeys.has(resource.slice(7));
        if ('graph' in metadata.config) {
          path = getResourcePath(workspace, resource, joined, metadata.config.graph);
        }
      }
    }
    history.push(path);
  }, [ordered, selected, history.push]);

  useShortcut('cycleForward', useCallback((e: KeyboardEvent) => {
    cycleChannels(false);
    e.preventDefault();
  }, [cycleChannels]));

  useShortcut('cycleBack', useCallback((e: KeyboardEvent) => {
    cycleChannels(true);
    e.preventDefault();
  }, [cycleChannels]));

  const hasNotification = workspace.type === 'group' && getHasNotification(associations, workspace.group, unseen);
  const graphUnreads = getGraphUnreads(associations || ({} as Associations));
  const groupPath = isGroup ? workspace.group : '';
  const unreadCount = isGroup ? graphUnreads(groupPath) : dmUnreads(unreads);
  const isSynced = true;
  const isPending = false;
  const to = `/~landscape${isGroup ? workspace?.group : isMessages ? '/messages' : '/home'}`;
  const isMobileMessages = IS_MOBILE && isMessages;
  const groupTitle = title ? title : isHome ? 'My Channels' : 'Messages';
  const association = isGroup ? associations?.groups[workspace.group] : undefined;
  const feedPath = getFeedPath(association);
  const isAdmin = isGroup && roleForShip(groups[workspace.group], window.ship) === 'admin';
  const locked = isGroup && Boolean(groups[association.group]?.policy?.invite);

  return (
    <Box ref={groupRef} position="relative">
      {!isMobileMessages && <SidebarItemBase
        to={to}
        selected={groupSelected}
        hasUnread={unreadCount > 0}
        unreadCount={unreadCount}
        isSynced={isSynced}
        title={groupTitle}
        hasNotification={hasNotification}
        pending={isPending}
        onClick={() => setCollapsed(isMessages ? false : !collapsed)}
        isGroup
        locked={locked}
        isAdmin={isAdmin}
        open={!collapsed}
      >
        {!isMessages && (
          <Icon
            p={1}
            pr="0"
            display="block"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setCollapsed(!collapsed);
              groupRef.current?.scrollIntoView();
            }}
            icon={collapsed ? 'TriangleEast' : 'TriangleSouth'}
          />
        )}
      </SidebarItemBase>}
      {!collapsed && (
        <Box position="relative" style={{ zIndex: 0 }}>
          {feedPath && IS_MOBILE && <SidebarItemBase
            to={`/~landscape${groupPath}/feed`}
            selected={history.location.pathname.includes('feed')}
            title="Group Feed"
            groupSelected={groupSelected}
            fontSize="13px"
            isSynced
            hasNotification={false} // How to get notifications and unreads for this?
            hasUnread={false}
            unreadCount={0}
            // unreadCount={count + each.length}
            // hasNotification={Boolean(unseen?.[`landscape${pathAsGraph}/mention`])}
            indent={1}
          >
            <Icon display="block" color="black" icon="Collection" />
          </SidebarItemBase>}
          {ordered.map((pathOrShip) => {
            const pathAsGraph = pathOrShip.replace('ship', 'graph');
            const { count, each } = unreads[pathAsGraph] || { count: 0, each: [] };

            return pathOrShip.startsWith('~') ? (
                <SidebarDmItem
                  key={pathOrShip}
                  ship={pathOrShip}
                  workspace={workspace}
                  selected={pathOrShip === selected}
                  pending={pending.includes(pathOrShip)}
                  indent={0.5}
                />
              ) : pending.includes(pathOrShip) ? (
                <SidebarPendingItem
                  key={pathOrShip}
                  path={pathOrShip}
                  selected={pathOrShip === selected}
                  indent={1}
                />
              ) : (
              <SidebarAssociationItem
                key={pathOrShip}
                selected={pathOrShip === selected}
                groupSelected={groupSelected}
                association={associations.graph[pathOrShip]}
                hideUnjoined={config.hideUnjoined}
                fontSize="13px"
                workspace={workspace}
                unreadCount={count + each.length}
                hasNotification={Boolean(unseen?.[`landscape${pathAsGraph}/mention`])}
                indent={isMessages ? 0.5 : 1}
              />
              );
          })}
        </Box>
      )}
    </Box>
  );
}

interface SidebarFolderProps {
  config: SidebarListConfig;
  baseUrl: string;
  folder: GroupFolder;
  toggleCollapse: () => void;
}

export const SidebarFolder = ({
  folder,
  toggleCollapse,
  ...props
}: SidebarFolderProps) => {
  const { associations } = useMetadataState();
  const graphUnreads = getGraphUnreads(associations || ({} as Associations));
  const { unseen } = useHarkState();
  const collapsed = Boolean(folder.collapsed);
  const dark = useDark();
  const folderIconStyle = {
    height: '14px',
    width: '18px',
    paddingTop: '3px',
    color: dark ? 'white' : 'black'
  };

  const { unreadCount, hasNotification } = folder.groups.reduce((acc, group) => {
    return {
      unreadCount: acc.unreadCount + graphUnreads(group),
      hasNotification: acc.hasNotification || getHasNotification(associations, group, unseen)
    };
  }, { unreadCount: 0, hasNotification: false });

  return (
    <Box position="relative">
      <SidebarItemBase
        to={''}
        title={folder.folder}
        hasUnread={unreadCount > 0}
        unreadCount={unreadCount}
        hasNotification={hasNotification}
        onClick={toggleCollapse}
        isFolder
        isSynced
        open={!collapsed}
      >
        <Box display="block" pl="2px"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleCollapse();
          }}
        >
          {collapsed ? <FaFolder style={folderIconStyle} /> : <FaFolderOpen style={folderIconStyle} />}
        </Box>
      </SidebarItemBase>
      {!collapsed && (
        <Box position="relative" style={{ zIndex: 0 }} pl="20px">
          {folder.groups.map((group) => {
            const g = associations.groups[group];
            if (!g)
              return null;

            return <SidebarGroup key={g.group} {...props} workspace={{ type: 'group', group: g.group }} title={g.metadata.title} />;
          })}
        </Box>
      )}
    </Box>
  );
};
