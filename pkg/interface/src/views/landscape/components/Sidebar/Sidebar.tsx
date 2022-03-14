import {
  Box,
    Col
} from '@tlon/indigo-react';
import React, { ReactElement, useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { roleForShip } from '~/logic/lib/group';
import { IS_MOBILE, IS_SHORT_SCREEN } from '~/logic/lib/platform';
import { useLocalStorageState } from '~/logic/lib/useLocalStorageState';
import { getGroupFromWorkspace } from '~/logic/lib/workspace';
import useGroupState from '~/logic/state/group';
import useSettingsState from '~/logic/state/settings';
import { Workspace } from '~/types';
import { getNavbarHeight } from '~/views/components/navigation/MobileNavbar';
import { GroupSwitcher } from '../GroupSwitcher';
import { SidebarGroupList } from './SidebarGroupList';
import { SidebarListConfig } from './types';
import { GroupOrder } from './SidebarGroupSorter';

export const HEADER_HEIGHT = 48;

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
  const groupPath = getGroupFromWorkspace(workspace);
  const [changingSort, setChangingSort] = useState(false);
  const { groupSorter, putEntry } = useSettingsState.getState();
  const [groupOrder, setGroupOrder] = useState<GroupOrder>(JSON.parse(groupSorter.order || '[]'));

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

  const [config] = useLocalStorageState<SidebarListConfig>(
    `group-config:${groupPath || 'home'}`,
    {
      sortBy: 'lastUpdated',
      hideUnjoined: false
    }
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
  } else if (changingSort) {
    groupsHeight = `calc(100% - ${HEADER_HEIGHT}px)`;
  }

  const groupListProps = { config, selected, baseUrl, changingSort, groupOrder, saveGroupOrder };

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
      {(!isSmallScreen || !focusMessages) && (
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
          pb={1}
        >
          <Box mt={2} />
          <SidebarGroupList {...groupListProps} {...{ changingSort }} />
        </ScrollbarLessCol>
      )}
      {(!changingSort && !isSmallScreen || focusMessages) && (
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
