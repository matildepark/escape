import React, { ReactElement, useCallback } from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';

import { Box, Col, Icon, Row, Text } from '@tlon/indigo-react';
import useMetadataState from '~/logic/state/metadata';
import { Dropdown } from '~/views/components/Dropdown';
import styled from 'styled-components';

export type GroupFolder = {
  folder: string,
  collapsed?: boolean,
  groups: string[]
};
export type GroupOrder = (string | GroupFolder)[];

const FolderRow = styled(Text)`
  padding: 4px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  cursor: pointer;
  &:hover {
    background-color: ${p => p.theme.colors.washedGray};
  }
`;

const GroupTileIcon = styled(Icon)`
  padding: 4px;
  cursor: pointer;
`;

export interface MoveFolderArgs {
  orig?: string;
  dest?: string;
  group: string;
}

interface GroupTileProps {
  title: string;
  group: string;
  folders: string[];
  folder?: string;
  canReorder?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  moveToFolder: (args: MoveFolderArgs) => void;
  moveUp?: () => void;
  moveDown?: () => void;
}

function GroupTile({
  title,
  group,
  folders,
  folder,
  moveToFolder,
  moveUp = () => null,
  moveDown = () => null,
  canReorder = false,
  isFirst = false,
  isLast = false
}: GroupTileProps) {
  const isInFolder = Boolean(folder);

  return (
    <Row py={isInFolder ? 1 : 2} px={isInFolder ? 2 : 3}
      my={2} mx={isInFolder ? 0 : 2}
      alignItems="center" justifyContent="space-between"
      borderRadius={2} overflow="hidden"
      whiteSpace="nowrap" textOverflow="ellipsis"
      backgroundColor="white"
    >
      <Text overflow="hidden" whiteSpace="nowrap" textOverflow="ellipsis">{title}</Text>
      <Row alignItems="center" mr={-1}>
        {isInFolder && (
          <>
            {(canReorder && !isFirst) && <GroupTileIcon icon="ChevronNorth" onClick={moveUp} />}
            {(canReorder && !isLast) && <GroupTileIcon icon="ChevronSouth" onClick={moveDown} />}
          </>
        )}
        <Dropdown
          dropWidth='192px'
          width='auto'
          alignY='top'
          alignX='right'
          flexShrink={0}
          offsetY={-24}
          options={
            <Col
              p={2}
              backgroundColor='white'
              border={1}
              borderColor="lightGray"
              borderRadius={2}
            >
              <Text>Move to folder:</Text>
              {folder && <FolderRow onClick={() => moveToFolder({ orig: folder, group })}>Remove from {folder}</FolderRow>}
              {folders.filter(f => f !== folder).map(f => (
                <FolderRow key={f} onClick={() => moveToFolder({ orig: folder, dest: f, group })}>{f}</FolderRow>
              ))}
            </Col>
          }
        >
          <GroupTileIcon icon="Menu" />
        </Dropdown>
      </Row>
    </Row>
  );
}

interface GroupCardProps {
  title: string;
  group: string;
  index: number;
  folders: string[];
  moveToFolder: (args: MoveFolderArgs) => void;
}

function GroupCard({ title, group, index, folders, moveToFolder }: GroupCardProps) {
  // TODO: make this addable to a folder
  return (
    <Draggable key={group} draggableId={group} index={index}>
      {provided => <Box ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
        <GroupTile {...{ title, folders, group, moveToFolder }} />
      </Box>}
    </Draggable>
  );
}

interface FolderCardProps {
  title: string;
  group: string;
  index: number;
  groups: string[];
  folders: string[];
  getTitle: (g: string | GroupFolder) => string;
  moveToFolder: (args: MoveFolderArgs) => void;
  reorderGroup: (folder: string, group: string, index: number, direction: 'up' | 'down') => void;
  deleteFolder: (folder: string) => void;
}

function FolderCard({
  title,
  group,
  index,
  groups,
  folders,
  getTitle,
  moveToFolder,
  reorderGroup,
  deleteFolder
}: FolderCardProps) {
  return (
    <Draggable key={group} draggableId={group} index={index}>
      {provided => (
        <Col py={2} px={3}
          m={2} backgroundColor="white"
          borderRadius={2}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          overflow="hidden"
          whiteSpace="nowrap"
          textOverflow="ellipsis"
        >
          <Row alignItems="center" justifyContent="space-between">
            <Text fontWeight="600">{title}</Text>
            <Dropdown
              dropWidth='192px'
              width='auto'
              alignY='top'
              alignX='right'
              flexShrink={0}
              offsetY={-24}
              options={
                <Col
                  p={2}
                  backgroundColor='white'
                  border={1}
                  borderColor="lightGray"
                  borderRadius={2}
                >
                  <FolderRow onClick={() => deleteFolder(title)} color="red">Delete folder</FolderRow>
                </Col>
              }
            >
              <GroupTileIcon icon="Menu" />
            </Dropdown>
          </Row>
          <Box {...provided.droppableProps} ref={provided.innerRef} backgroundColor="washedGray" mx={-2} mt={2} px={1} py={0} borderRadius={2} minHeight="30px">
            {groups.map((g, i) => (
              <GroupTile
                key={g} title={getTitle(g)}
                group={g} folder={title}
                canReorder={groups.length > 1} folders={folders}
                isFirst={i === 0} isLast={i === groups.length - 1}
                moveUp={() => reorderGroup(title, g, i, 'up')}
                moveDown={() => reorderGroup(title, g, i, 'down')}
                moveToFolder={moveToFolder}
              />
            ))}
          </Box>
        </Col>
      )}
    </Draggable>
  );
}

interface SidebarGroupSorterProps {
  groupOrder?: GroupOrder;
  moveToFolder: (args: MoveFolderArgs) => void;
  reorderGroup: (folder: string, group: string, index: number, direction: 'up' | 'down') => void;
  deleteFolder: (folder: string) => void;
}

export function SidebarGroupSorter({
  groupOrder = [],
  moveToFolder,
  reorderGroup,
  deleteFolder
}: SidebarGroupSorterProps): ReactElement {
  const { associations } = useMetadataState();

  const getTitle = useCallback((g: string | GroupFolder) => typeof g === 'string' ? associations.groups[g]?.metadata?.title : g?.folder, [associations]);
  const folders = groupOrder.filter(entry => entry && typeof entry !== 'string').map(({ folder }: any) => folder);

  return (
    <Droppable droppableId="groups" style={{ width: '100%' }}>
      {provided => (
        <Box {...provided.droppableProps} ref={provided.innerRef} backgroundColor="washedGray" mt="-8px" mb="-4px">
          {groupOrder.map((entry, index) => {
            const title = getTitle(entry);
            if (typeof entry === 'string' && title) {
              return <GroupCard {...{ key: entry, title, group: entry, index, folders, moveToFolder }} />;
            } else if (entry && typeof entry !== 'string' && title) {
              return (
                <FolderCard
                  {...{ key: entry.folder, title, group: entry.folder, index, groups: entry.groups, folders, getTitle, moveToFolder, reorderGroup, deleteFolder }}
                />
              );
            }

            return null;
          })}
          {provided.placeholder}
        </Box>
      )}
    </Droppable>
  );
}
