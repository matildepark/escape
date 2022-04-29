import {
  Col,
  Label,
  ManagedRadioButtonField as Radio,
  StatelessTextInput as Input,
  Text
} from '@tlon/indigo-react';
import { Form, Field } from 'formik';
import React, { useCallback } from 'react';
import * as Yup from 'yup';
import useSettingsState, { SettingsState } from '~/logic/state/settings';
import { FormikOnBlur } from '~/views/components/FormikOnBlur';
import { BackButton } from './BackButton';
import { BackgroundPicker, BgType } from './BackgroundPicker';
import shallow from 'zustand/shallow';

const formSchema = Yup.object().shape({
  bgType: Yup.string()
    .oneOf(['none', 'color', 'url'], 'invalid')
    .required('Required'),
  bgColor: Yup.string().when('bgType', (bgType, schema) => bgType === 'color' ? schema.required() : schema),
  bgUrl: Yup.string().when('bgType', (bgType, schema) => bgType === 'url' ? schema.required() : schema),
  theme: Yup.string().oneOf(['light', 'dark', 'auto', 'custom']).required('Required'),
  sans: Yup.string(),
  white: Yup.string(),
  black: Yup.string(),
  border: Yup.string()
});

interface FormSchema {
  bgType: BgType;
  bgColor: string | undefined;
  bgUrl: string | undefined;
  theme: string;
  sans: string;
  white: string;
  black: string;
  border: string;
}
const emptyString = '';

const settingsSel = (s: SettingsState): FormSchema => {
  const { display } = s;
  let bgColor = emptyString;
  let bgUrl = emptyString;
  let sans = emptyString;
  let white = "";
  let black = "";
  let border = "";
  if (display.backgroundType === 'url') {
    bgUrl = display.background;
  }
  if (display.backgroundType === 'color') {
    bgColor = display.background;
  }
  if (display.theme === 'custom') {
    sans = display.sans;
    white = display.white;
    black = display.black;
    border = display.border;
  }

  return {
    bgType: display.backgroundType,
    bgColor,
    bgUrl,
    theme: display.theme,
    sans,
    white,
    black,
    border
  };
};

export default function DisplayForm() {
  const initialValues = useSettingsState(settingsSel, shallow);

  const onSubmit = useCallback(async (values) => {
    const { putEntry } = useSettingsState.getState();
    const { bgType, bgColor, bgUrl, theme, sans, white, black, border } = initialValues;

    if (bgType !== values.bgType) {
      putEntry('display', 'backgroundType', values.bgType);
    }

    if (bgColor !== values.bgColor || bgUrl !== values.bgUrl) {
      putEntry(
        'display',
        'background',
        values.bgType === 'color'
          ? values.bgColor
          : values.bgType === 'url'
          ? values.bgUrl || ''
          : ''
      );
    }

    if (theme !== values.theme) {
      putEntry('display', 'theme', values.theme);
    }
    if (sans !== values.sans) {
      putEntry('display', 'sans', values.sans);
    }
    if (white !== values.white) {
      putEntry('display', 'white', values.white);
    }
    if (black !== values.black) {
      putEntry('display', 'black', values.black);
    }
    if (border !== values.border) {
      putEntry('display', 'border', values.border);
    }
  }, [initialValues]);

  return (
    <FormikOnBlur
      validationSchema={formSchema}
      initialValues={initialValues}
      onSubmit={onSubmit}
    >
      <Form>
        <BackButton />
        <Col p={5} pt={4} gapY={5}>
          <Col overflowY="auto" gapY={1} mt={0}>
            <Text color="black" fontSize={2} fontWeight="medium">
              Display Preferences
            </Text>
            <Text gray>Customize visual interfaces across Groups</Text>
          </Col>
          <BackgroundPicker />
          <Label>Theme</Label>
          <Radio name="theme" id="light" label="Light" />
          <Radio name="theme" id="dark" label="Dark" />
          <Radio name="theme" id="auto" label="Auto" />
          <Radio name="theme" id="custom" label="Custom" />
          {initialValues.theme === 'custom' && (
            <>
            <Label>Font</Label>
            <Field name="sans" placeholder="Inter" style={{ backgroundColor: 'transparent'}}/>
            <Label>Background</Label>
            <Field placeholder="rgba(255,255,255,1)" name="white" style={{ backgroundColor: 'transparent'}} />
            <Label>Text</Label>
            <Field placeholder="rgba(0,0,0,1)" name="black" style={{ backgroundColor: 'transparent'}}/>
            <Label>Borders</Label>
            <Field name="border" placeholder="1px solid" style={{ backgroundColor: 'transparent'}}/>
            </>
          )}
        </Col>
      </Form>
    </FormikOnBlur>
  );
}
