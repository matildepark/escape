import React, { FC, PropsWithChildren, ReactNode, useCallback, useState, useImperativeHandle, MouseEvent } from 'react';
import Picker from 'emoji-picker-react';
import { Box, Col, Icon, LoadingSpinner, Row, Text } from '@tlon/indigo-react';
import { Association, Contact, Content, evalCord, Group } from '@urbit/api';
import tokenizeMessage from '~/logic/lib/tokenizeMessage';
import { IuseStorage } from '~/logic/lib/useStorage';
import { MOBILE_BROWSER_REGEX } from '~/logic/lib/util';
import { withLocalState } from '~/logic/state/local';
import airlock from '~/logic/api';
import { useChatStore, useReplyStore } from '~/logic/state/chat';
import { FileUploadSource, useFileUpload } from '~/logic/lib/useFileUpload';
import { IS_MOBILE } from '~/logic/lib/platform';
import ChatEditor, { CodeMirrorShim, isMobile } from './ChatEditor';
// import { ChatAvatar } from './ChatAvatar';

type ChatInputProps = PropsWithChildren<IuseStorage & {
  hideAvatars: boolean;
  ourContact?: Contact;
  placeholder: string;
  onSubmit: (contents: Content[]) => void;
  isAdmin: boolean;
  group: Group;
  association: Association;
  chatEditor: React.RefObject<CodeMirrorShim>
}>;

const InputBox: FC<{ isReply: boolean; children?: ReactNode; }> = ({ isReply, children }) => (
  <Col
    position='relative'
    flexGrow={1}
    flexShrink={0}
    borderTop={1}
    borderTopColor='lightGray'
    backgroundColor='white'
    className='cf'
    zIndex={0}
    height={isReply ? `${IS_MOBILE ? 100 : 84}px` : 'auto'}
  >
    { children }
  </Col>
);

const IconBox = ({ children, ...props }) => (
  <Box
    ml='12px'
    mr={3}
    flexShrink={0}
    height='16px'
    width='16px'
    flexBasis='16px'
    {...props}
  >
    { children }
  </Box>
);

const MobileSubmitButton = ({ enabled, onSubmit }) => (
  <Box
    ml={2}
    mr="12px"
    flexShrink={0}
    display="flex"
    justifyContent="center"
    alignItems="center"
    width="24px"
    height="24px"
    borderRadius="50%"
    backgroundColor={enabled ? 'blue' : 'gray'}
    cursor={enabled !== '' ? 'pointer' : 'default'}
    onClick={() => onSubmit()}
  >
    <Icon icon="ArrowEast" color="white" />
  </Box>
);

export const ChatInput = React.forwardRef(({
  ourContact,
  hideAvatars,
  placeholder,
  onSubmit,
  isAdmin,
  group,
  association,
  chatEditor
}: ChatInputProps, ref) => {
  // const chatEditor = useRef<CodeMirrorShim>(null);
  useImperativeHandle(ref, () => chatEditor.current);
  const [inCodeMode, setInCodeMode] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const { message, setMessage } = useChatStore();
  const { reply, setReply } = useReplyStore();
  const { canUpload, uploading, promptUpload, onPaste } = useFileUpload({
    onSuccess: uploadSuccess
  });

  function uploadSuccess(url: string, source: FileUploadSource) {
    if (source === 'paste') {
      setMessage(url);
    } else {
      onSubmit([{ url }]);
    }
  }

  function toggleCode() {
    setInCodeMode(!inCodeMode);
  }

  const submit = useCallback(async () => {
    const text = `${reply.link}${chatEditor.current?.getValue() || ''}`;

    if (text === '')
      return;

    if (inCodeMode) {
      const output = await airlock.thread<string[]>(evalCord(text));
      onSubmit([{ code: { output, expression: text } }]);
    } else {
      onSubmit(tokenizeMessage(text));
    }

    setInCodeMode(false);
    setMessage('');
    setReply();
    chatEditor.current.focus();
  }, [reply]);

  const onEmojiClick = (event, emojiObject) => {
    if (isMobile) {
      const cursor = chatEditor?.current.getCursor();
      const value = chatEditor?.current.getValue();
      const newValue = `${value.slice(0, cursor)}${emojiObject.emoji}${value.slice(cursor)}`;
      chatEditor?.current.setValue(newValue);
      setMessage(newValue);
    } else {
      const doc = chatEditor?.current.getDoc();
      const cursor = doc.getCursor();
      doc.replaceRange(emojiObject.emoji, cursor);
    }

    setShowEmojiPicker(false);
  };

  const closeEmojiPicker = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShowEmojiPicker(false);
  };

  const isReply = Boolean(reply.link);
  const [, patp] = reply.link.split('\n');

  return (
    <InputBox isReply={isReply}>
      {(isReply) && (
        <Row mt={2} ml="12px" p={1} px="6px" mr="auto" borderRadius={3} backgroundColor="washedGray" cursor='pointer' maxWidth="calc(100% - 24px)" onClick={() => setReply('')}>
          <Icon icon="X" size={18} mr={1} />
          <Text whiteSpace='nowrap' textOverflow='ellipsis' maxWidth="100%" overflow="hidden">Replying to <Text mono>{patp}</Text> {`"${reply.content}"`}</Text>
        </Row>
      )}
      {showEmojiPicker && (
        <Box position="absolute" bottom="42px" backgroundColor="white" borderRadius={4}>
          <Box position="fixed" top="0" bottom="0" left="0" right="0" background="transparent" onClick={closeEmojiPicker} />
          <Picker onEmojiClick={onEmojiClick} />
        </Box>
      )}
      <Row alignItems='center' position='relative' flexGrow={1} flexShrink={0}>
        <Row cursor='pointer' p='8px 4px 12px 8px' flexShrink={0} alignItems='center' onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
          {/* <ChatAvatar contact={ourContact} hideAvatars={hideAvatars} /> */}
          <Text fontSize="28px" lineHeight="0.75">&#9786;</Text>
        </Row>
        <ChatEditor
          ref={chatEditor}
          inCodeMode={inCodeMode}
          onPaste={(cm, e) => onPaste(e)}
          {...{ submit, placeholder, isAdmin, group, association, setShowEmojiPicker }}
        />
        <IconBox mr={canUpload ? '12px' : 3}>
          <Icon
            icon='Dojo'
            cursor='pointer'
            onClick={toggleCode}
            color={inCodeMode ? 'blue' : 'black'}
          />
        </IconBox>
        {canUpload && (
          <IconBox>
            {uploading ? (
              <LoadingSpinner />
            ) : (
              <Icon
                icon='Attachment'
                cursor='pointer'
                width='16'
                height='16'
                onClick={() =>
                  promptUpload().then(url => uploadSuccess(url, 'direct'))
                }
              />
            )}
          </IconBox>
        )}
        {MOBILE_BROWSER_REGEX.test(navigator.userAgent) && (
          <MobileSubmitButton
            enabled={message !== ''}
            onSubmit={submit}
          />
        )}
      </Row>
    </InputBox>
  );
});

// @ts-ignore withLocalState prop passing weirdness
export default withLocalState<Omit<ChatInputProps, keyof IuseStorage>, 'hideAvatars', ChatInput>(
  ChatInput,
  ['hideAvatars']
);
