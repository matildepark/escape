import React, { MouseEvent, ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { resourceAsPath } from '@urbit/api';
import _ from 'lodash';
import { DragDropContext } from 'react-beautiful-dnd';

import { SidebarItemBase } from './SidebarItem';
import { SidebarListConfig } from './types';
import useMetadataState, { usePreview } from '~/logic/state/metadata';
import { useHistory } from 'react-router';
import useGroupState from '~/logic/state/group';
import useInviteState from '~/logic/state/invite';
import { sortGroupsAlph } from '~/views/apps/launch/components/Groups';
import { Box, LoadingSpinner } from '@tlon/indigo-react';
import { useQuery } from '~/logic/lib/useQuery';
import { GroupOrder, MoveFolderArgs, SidebarGroupSorter } from './SidebarGroupSorter';
import { SidebarFolder, SidebarGroup } from './SidebarGroup';

interface PendingSidebarGroupProps {
  path: string;
}

function PendingSidebarGroup({ path }: PendingSidebarGroupProps) {
  const history = useHistory();
  const { preview } = usePreview(path);
  const title = preview?.metadata?.title || path;
  const { toQuery } = useQuery();
  const onClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    history.push(toQuery({ 'join-kind': 'groups', 'join-path': path }));
  };

  const joining = useGroupState(s => s.pendingJoin[path]?.progress);
  const isJoining = Boolean(joining && joining !== 'done');

  return (
    <SidebarItemBase
      to="/"
      onClick={onClick}
      title={title}
      selected={false}
      pending={isJoining}
      hasUnread={false}
      hasNotification={!joining}
      isSynced={!joining}
      isGroup
    />
  );
}

export function SidebarGroupList({
  messages = false,
  changingSort = false,
  groupOrder,
  saveGroupOrder,
  ...props
}: {
  config: SidebarListConfig;
  baseUrl: string;
  changingSort?: boolean;
  selected?: string;
  messages?: boolean;
  groupOrder: GroupOrder;
  saveGroupOrder: (groupOrder: GroupOrder) => void;
}): ReactElement {
  const { associations } = useMetadataState();
  const { groups } = useGroupState();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 8000);
  }, []);

  const handleDragAndDrop = useCallback(({ source, destination }) => {
    if (!destination)
      return;

    const items = Array.from(groupOrder);
    const [reorderedItem] = items.splice(source.index, 1);
    items.splice(destination.index, 0, reorderedItem);
    saveGroupOrder(items);
  }, [groupOrder, saveGroupOrder]);

  const moveToFolder = useCallback(({ orig, dest, group }: MoveFolderArgs) => {
    if (orig) {
      const newOrder = groupOrder.map((go) => {
        if (go && typeof go !== 'string' && go.folder === orig) {
          return { folder: orig, groups: go.groups.filter(g => g !== group) };
        } else if (go && typeof go !== 'string' && go.folder === dest) {
          return { folder: dest, groups: go.groups.concat([group]) };
        }
        return go;
      });
      if (!dest) {
        newOrder.unshift(group);
      }
      saveGroupOrder(newOrder);
    } else {
      const newOrder = groupOrder
        .map((go) => {
          if (go && typeof go !== 'string' && go.folder === dest) {
            return { folder: dest, groups: go.groups.concat([group]) };
          }
          return go;
        })
        .filter(go => typeof go !== 'string' || go !== group);

      saveGroupOrder(newOrder);
    }
  }, [groupOrder, saveGroupOrder]);

  const reorderGroup = useCallback((folder: string, group: string, index: number, direction: 'up' | 'down') => {
    const newOrder = groupOrder.map((go) => {
      if (go && typeof go !== 'string' && go.folder === folder) {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        const groups = Array.from(go.groups);
        const [reorderedGroup] = groups.splice(index, 1);
        groups.splice(newIndex, 0, reorderedGroup);
        return { folder, groups };
      }
      return go;
    });
    saveGroupOrder(newOrder);
  }, [groupOrder, saveGroupOrder]);

  const deleteFolder = useCallback((folder: string) => {
    if (confirm('Are you sure you want to delete this folder? The groups will be moved to the bottom of the main list.')) {
      let groups: string[] = [];
      const newOrder = groupOrder.filter((go) => {
        if (go && typeof go !== 'string' && go.folder === folder) {
          groups = go.groups;
          return false;
        }
        return true;
      });
      newOrder.concat(groups);
      saveGroupOrder(newOrder);
    }
  }, [groupOrder, saveGroupOrder]);

  const toggleCollapse = useCallback((folder: string) => () => {
    const newOrder = groupOrder.map((go) => {
      if (go && typeof go !== 'string' && go.folder === folder) {
        go.collapsed = !go.collapsed;
      }
      return go;
    });
    saveGroupOrder(newOrder);
  }, [groupOrder, saveGroupOrder]);

  const groupList = useMemo(() => Object.values(associations?.groups || {})
    .filter(e => e?.group in groups)
    .sort(sortGroupsAlph), [associations, groups]);

  useEffect(() => {
    if (!groupOrder.length)
      return;

    const sortedGroups = groupOrder.reduce((acc, cur) => {
      if (cur && typeof cur !== 'string') {
        return acc.concat(cur.groups);
      } else if (typeof cur === 'string') {
        return acc.concat([cur]);
      }
      return acc;
    }, []);

    const missingGroups = groupList.map(({ group }) => group).filter(g => !sortedGroups.includes(g));
    if (!sortedGroups.includes('My Channels')) {
      missingGroups.push('My Channels');
    }

    if (missingGroups.length) {
      saveGroupOrder(missingGroups.concat(groupOrder as any[]));
    }
  }, [groupList]);

  const joining = useGroupState(s =>
    _.omit(
      _.pickBy(s.pendingJoin || {}, req => req.app === 'groups' && req.progress != 'abort'),
      groupList.map(g => g.group)
    )
  );

  const invites = useInviteState(s => Object.values(s.invites?.['groups'] || {}).map(inv => resourceAsPath(inv?.resource)) || []);
  const pending = _.union(invites, Object.keys(joining)).filter(group =>
    !(group in (groups?.groups || {})) && !(group in (associations.groups || {}))
  );

  if (messages) {
    return <SidebarGroup {...props} workspace={{ type: 'messages' }} />;
  } else if (!groupList.length && loading) {
    return <Box width="100%" height="100%" display="flex" alignItems="center" justifyContent="center">
      <LoadingSpinner />
    </Box>;
  }

  if (changingSort) {
    const groupsToSort = groupOrder.length ? groupOrder : ['My Channels'].concat(groupList.map(g => g.group));
    return <DragDropContext onDragEnd={handleDragAndDrop}>
      <SidebarGroupSorter {...{ groupOrder: groupsToSort, moveToFolder, reorderGroup, deleteFolder }} />
    </DragDropContext>;
  }

  return (
    <>
      {groupOrder.length ? groupOrder.map((go) => {
        if (typeof go === 'string') {
          if (go === 'My Channels') {
            return <SidebarGroup {...props} workspace={{ type: 'home' }} />;
          }

          const g = associations.groups[go];
          if (!g)
            return null;

          return <SidebarGroup key={g.group} {...props} workspace={{ type: 'group', group: g.group }} title={g.metadata.title} />;
        } else if (go?.folder) {
          return <SidebarFolder toggleCollapse={toggleCollapse(go.folder)} {...props} folder={go} />;
        }

        // TODO: handle folders in groupOrder
        return null;
      }) : (
        <>
          <SidebarGroup {...props} workspace={{ type: 'home' }} />
          {groupList.map((g: any) => (
            <SidebarGroup
              key={g.group} {...props}
              workspace={{ type: 'group', group: g.group }}
              title={g.metadata.title}
            />
          ))}
        </>
      )}
      {pending.map(p => <PendingSidebarGroup key={p} path={p} />)}
    </>
  );
}
