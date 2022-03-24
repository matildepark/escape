import React, { ReactElement, useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { Box, Button, Col, Row } from '@tlon/indigo-react';
import { FaFolder, FaFolderOpen } from 'react-icons/fa';

import { roleForShip } from '~/logic/lib/group';
import { IS_MOBILE, IS_SHORT_SCREEN } from '~/logic/lib/platform';
import { getGroupFromWorkspace } from '~/logic/lib/workspace';
import useGroupState from '~/logic/state/group';
import useSettingsState from '~/logic/state/settings';
import { useLocalStorageState } from '~/logic/lib/useLocalStorageState';
import { useDark } from '~/logic/state/join';
import { Workspace } from '~/types';
import { getNavbarHeight } from '~/views/components/navigation/MobileNavbar';
import { GroupSwitcher } from '../GroupSwitcher';
import { SidebarGroupList } from './SidebarGroupList';
import { GroupOrder } from './SidebarGroupSorter';

export const HEADER_HEIGHT = 45 + 40;

const ScrollbarLessCol = styled(Col)`
  scrollbar-width: none !important;

  ::-webkit-scrollbar {
    display: none;
  }
`;

interface SidebarProps {
  recentGroups: string[];
  selected?: string;
  baseUrl: string;
  workspace: Workspace;
}

export function Sidebar({ baseUrl, selected, workspace, recentGroups }: SidebarProps): ReactElement | null {
  const dark = useDark();
  const groupPath = getGroupFromWorkspace(workspace);
  const [changingSort, setChangingSort] = useState(false);
  const { groupSorter, putEntry } = useSettingsState.getState();
  const [groupOrder, setGroupOrder] = useState<GroupOrder>(JSON.parse(groupSorter.order || '[]'));

  const [showOnlyUnread, setShowOnlyUnread] = useLocalStorageState(
    'showOnlyUnread', false
  );

  const saveGroupOrder = useCallback((newOrder) => {
    const validOrder = newOrder.filter(o => o);
    putEntry('groupSorter', 'order', JSON.stringify(validOrder));
    setGroupOrder(validOrder);
  }, [putEntry, setGroupOrder]);

  useEffect(() => {
    const newGroupOrder = JSON.parse(groupSorter.order || '[]');
    if (newGroupOrder.length) {
      setGroupOrder(newGroupOrder);
    }
  }, [groupSorter.order]);

  const collapseAllFolders = (collapsed: boolean) =>
    saveGroupOrder(
      groupOrder.map(go => (go && typeof go !== 'string') ? ({ ...go, collapsed }) : (go))
    );

  const groups = useGroupState(state => state.groups);
  const navbarHeight = getNavbarHeight();
  const isSmallScreen = IS_MOBILE || IS_SHORT_SCREEN;

  const role = groups?.[groupPath] ? roleForShip(groups[groupPath], window.ship) : undefined;
  const isAdmin = (role === 'admin') || (workspace?.type === 'home');
  const focusMessages = baseUrl.includes('~landscape/messages');
  let groupsHeight = `calc(75% - ${HEADER_HEIGHT / 2}px)`;
  let messagesHeight = `calc(25% - ${HEADER_HEIGHT / 2}px)`;
  if (isSmallScreen && focusMessages) {
    messagesHeight = `calc(100% - ${(IS_SHORT_SCREEN ? 0 : navbarHeight) + HEADER_HEIGHT}px)`;
  } else if (isSmallScreen) {
    groupsHeight = `calc(100% - ${(IS_SHORT_SCREEN ? 0 : navbarHeight) + HEADER_HEIGHT}px)`;
  } else if (focusMessages) {
    groupsHeight = `calc(50% - ${HEADER_HEIGHT / 2}px)`;
    messagesHeight = `calc(50% - ${HEADER_HEIGHT / 2}px)`;
  } else if (changingSort || showOnlyUnread) {
    groupsHeight = `calc(100% - ${HEADER_HEIGHT}px)`;
  }

  const groupListProps = { selected, baseUrl, changingSort, groupOrder, saveGroupOrder, showOnlyUnread };
  // const selectorIconProps = { p: 2, cursor: 'pointer', size: 20 };
  const folderIconStyle = { height: '14px', width: '18px', padding: '2px', marginRight: '12px', cursor: 'pointer', color: dark ? 'white' : 'black' };
  const smallButtonProps = { fontSize: '13px', py: 0, px: 2, height: '24px' };

  return (
    <Box>
      <GroupSwitcher
        recentGroups={recentGroups}
        baseUrl={baseUrl}
        isAdmin={isAdmin}
        workspace={workspace}
        changingSort={changingSort}
        toggleChangingSort={() => setChangingSort(!changingSort)}
        groupOrder={groupOrder}
        saveGroupOrder={saveGroupOrder}
      />
      <Row alignItems="center" justifyContent="space-between" px="14px" py={2} borderRight={1} borderBottom={1} borderColor="lightGray" flexWrap="wrap">
        <Row alignItems="center">
          <FaFolder style={folderIconStyle} onClick={() => collapseAllFolders(true)} />
          <FaFolderOpen style={folderIconStyle} onClick={() => collapseAllFolders(false)} />
        </Row>
        {!showOnlyUnread && <Button {...smallButtonProps} onClick={() => setShowOnlyUnread(true)}>Focus Unread</Button>}
        {showOnlyUnread && <Button {...smallButtonProps} onClick={() => setShowOnlyUnread(false)}>Show All</Button>}
      </Row>
      {(!isSmallScreen || !focusMessages || showOnlyUnread) && (
        <ScrollbarLessCol
          display="flex"
          width="100%"
          gridRow="1/2"
          gridColumn="1/2"
          borderTopLeftRadius={2}
          borderRight={1}
          borderRightColor="lightGray"
          overflowY="scroll"
          fontSize={0}
          position={IS_MOBILE ? 'absolute' : 'relative'}
          height={groupsHeight}
          borderBottom={1}
          borderBottomColor="lightGray"
        >
          <Box mt={1} />
          <SidebarGroupList {...groupListProps} {...{ changingSort }} />
        </ScrollbarLessCol>
      )}
      {(!changingSort && !showOnlyUnread && !isSmallScreen || focusMessages) && (
        <ScrollbarLessCol
          display="flex"
          width="100%"
          gridRow="1/2"
          gridColumn="1/2"
          borderTopLeftRadius={2}
          borderRight={1}
          borderRightColor="lightGray"
          overflowY="scroll"
          fontSize={0}
          position={IS_MOBILE ? 'absolute' : 'relative'}
          height={messagesHeight}
        >
          <SidebarGroupList {...groupListProps} messages />
        </ScrollbarLessCol>
      )}
    </Box>
  );
}
