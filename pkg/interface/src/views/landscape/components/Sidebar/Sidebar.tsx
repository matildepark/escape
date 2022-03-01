import {
  Box,
    Col
} from '@tlon/indigo-react';
import React, { ReactElement, useState } from 'react';
import styled from 'styled-components';
import { roleForShip } from '~/logic/lib/group';
import { IS_SMALL_SCREEN } from '~/logic/lib/platform';
import { useLocalStorageState } from '~/logic/lib/useLocalStorageState';
import { getGroupFromWorkspace } from '~/logic/lib/workspace';
import useGroupState from '~/logic/state/group';
import { Workspace } from '~/types';
import { GroupSwitcher } from '../GroupSwitcher';
import { SidebarGroupList } from './SidebarGroupList';
import { SidebarListConfig } from './types';

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

  const role = groups?.[groupPath] ? roleForShip(groups[groupPath], window.ship) : undefined;
  const isAdmin = (role === 'admin') || (workspace?.type === 'home');
  const focusMessages = props.baseUrl.includes('~landscape/messages');
  let groupsHeight = 'calc(75% - 23px)';
  let messagesHeight = 'calc(25% - 24px)';
  if (IS_SMALL_SCREEN && focusMessages) {
    messagesHeight = 'calc(100% - 47px)';
  } else if (IS_SMALL_SCREEN) {
    groupsHeight = 'calc(100% - 47px)';
  } else if (focusMessages) {
    groupsHeight = 'calc(50% - 24px)';
    messagesHeight = 'calc(50% - 23px)';
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
      {(!IS_SMALL_SCREEN || !focusMessages) && (
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
          position="relative"
          height={groupsHeight}
          borderBottom={1}
          borderBottomColor="lightGray"
          pb={1}
        >
          <Box mt={2} />
          <SidebarGroupList {...{ config, selected, baseUrl, changingSort }} />
        </ScrollbarLessCol>
      )}
      {(!IS_SMALL_SCREEN || focusMessages) && (
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
          position="relative"
          height={messagesHeight}
        >
          <SidebarGroupList {...{ config, selected, baseUrl }} messages />
        </ScrollbarLessCol>
      )}
    </Box>
  );
}
