import {
  Box,
    Col
} from '@tlon/indigo-react';
import React, { ReactElement, useState } from 'react';
import styled from 'styled-components';
import { roleForShip } from '~/logic/lib/group';
import { IS_MOBILE, IS_SHORT_SCREEN } from '~/logic/lib/platform';
import { useLocalStorageState } from '~/logic/lib/useLocalStorageState';
import { getGroupFromWorkspace } from '~/logic/lib/workspace';
import useGroupState from '~/logic/state/group';
import { Workspace } from '~/types';
import { getNavbarHeight } from '~/views/components/navigation/MobileNavbar';
import { GroupSwitcher } from '../GroupSwitcher';
import { SidebarGroupList } from './SidebarGroupList';
import { SidebarListConfig } from './types';

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

export function Sidebar(props: SidebarProps): ReactElement | null {
  const { baseUrl, selected, workspace, recentGroups } = props;
  const groupPath = getGroupFromWorkspace(workspace);
  const [changingSort, setChangingSort] = useState(false);

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
  const focusMessages = props.baseUrl.includes('~landscape/messages');
  let groupsHeight = `calc(75% - ${HEADER_HEIGHT / 2}px)`;
  let messagesHeight = `calc(25% - ${HEADER_HEIGHT / 2}px)`;
  if (isSmallScreen && focusMessages) {
    messagesHeight = `calc(100% - ${(IS_SHORT_SCREEN ? 0 : navbarHeight) + HEADER_HEIGHT}px)`;
  } else if (isSmallScreen) {
    groupsHeight = `calc(100% - ${(IS_SHORT_SCREEN ? 0 : navbarHeight) + HEADER_HEIGHT}px)`;
  } else if (focusMessages) {
    groupsHeight = `calc(50% - ${HEADER_HEIGHT / 2}px)`;
    messagesHeight = `calc(50% - ${HEADER_HEIGHT / 2}px)`;
  }

  return (
    <Box>
      <GroupSwitcher
        recentGroups={recentGroups}
        baseUrl={baseUrl}
        isAdmin={isAdmin}
        workspace={workspace}
        changingSort={changingSort}
        toggleChangingSort={() => setChangingSort(!changingSort)}
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
          <SidebarGroupList {...{ config, selected, baseUrl, changingSort }} />
        </ScrollbarLessCol>
      )}
      {(!isSmallScreen || focusMessages) && (
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
          <SidebarGroupList {...{ config, selected, baseUrl }} messages />
        </ScrollbarLessCol>
      )}
    </Box>
  );
}
