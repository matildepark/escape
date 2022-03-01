import { Action, Box, Col, H2, H3, Icon, Row, Text } from '@tlon/indigo-react';
import React, { ReactElement, ReactNode, useEffect } from 'react';
import Helmet from 'react-helmet';
import { Link, Route, Switch, useHistory, useLocation } from 'react-router-dom';
import BookmarkIcon from '~/assets/img/bookmark.svg';
import useHarkState from '~/logic/state/hark';
import { useDark } from '~/logic/state/join';
import { Body } from '~/views/components/Body';

export default function InfoScreen(props: any): ReactElement {
  const dark = useDark();
  const bookmarkStyle = { height: 15, width: 12, paddingLeft: 1, color: dark ? 'white' : 'black' };

  return (
    <>
      <Helmet defer={false}>
        <title>EScape Info</title>
      </Helmet>
      <Body>
        <Col overflowY="scroll" height="100%" py={3} px={4}>
          <H2>EScape Info</H2>
          <H3 mt={4}>What&apos;s in v0.2.0</H3>
          <Text fontWeight={600} mt={3} mb={2}>New:</Text>
          <Text mt={1}>- Add an info page for features like mentions, bookmarks, and updates</Text>
          <Text mt={1}>- For iPad landscape, the sidebar should be full-screen for both groups and messages</Text>
          <Text mt={1}>- If scrolled down in a group, the group still appears at the top</Text>
          <Text mt={1}>- “Enter” key autocompletes @p mentions</Text>
          <Text mt={1}>- Mobile push notifications</Text>
          <Text fontWeight={600} mt={3} mb={2}>Fixes:</Text>
          <Text mt={1}>- Fix nickname display in ProfileOverlay</Text>
          <Text mt={1}>- Keep ProfileOverlay on-screen on mobile</Text>
          <Text mt={1}>- Update @p mention feature to groups with {'< 500'} members (instead of 200)</Text>
          <Text mt={1}>- Refreshing from a resource view no longer hangs</Text>
          <H3 mt={4}>Chat Features</H3>
          <Text fontWeight={600} mt={3} mb={2}>Hover Options:</Text>
          <Row mt={1}>
            <Icon icon="Chat" />
            <Text ml={2}>Reply to chat message</Text>
          </Row>
          <Row mt={1}>
            <BookmarkIcon style={bookmarkStyle} className="actionIcon" />
            <Text ml={2}>Bookmark message by either adding to &apos;My Bookmarks&apos; collection or (if admin) any collection in current group</Text>
          </Row>
          <Row mt={1}>
            <Icon icon="CheckmarkBold" />
            <Text ml={2}>Like the message</Text>
          </Row>
          <Row mt={1}>
            <Icon icon="Menu" />
            <Text ml={2}>Opens additional options to reply, copy the message link, and (if author or admin) delete the message</Text>
          </Row>
          <Text fontWeight={600} mt={3} mb={2}>Mentions:</Text>
          <Text mt={1}>- Start typing &apos;~&apos; to open the mention selector</Text>
          <Text mt={1}>- Navigate using the up and down arrows</Text>
          <Text mt={1}>- Use Tab button to select highlighted @p</Text>
          <Text mt={1}>- If @p is not in the group, admins can invite directly</Text>
          <Text fontWeight={600} mt={3} mb={2}>User Profile:</Text>
          <Text mt={1}>- Click on user&apos;s @p or sigil to open profile popup</Text>
          <Text mt={1}>- Click on sigil to see the full profile</Text>
          <Text mt={1}>- Click on @p to copy @p</Text>
          <Text mt={1}>- &apos;Message&apos; option opens DM to user</Text>
          <Text mt={1}>- Adding user to pals gives prompt to download the <Text mono>%pals</Text> app if not installed</Text>
          <Text mt={1}>- Max of 5 <Text mono>%pals</Text> tags can be added with a max length of 20 characters</Text>
        </Col>
      </Body>
    </>
  );
}
