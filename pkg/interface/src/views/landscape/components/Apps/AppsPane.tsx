import React from 'react';
import Helmet from 'react-helmet';
import { Route, Switch } from 'react-router-dom';
import { Workspace } from '~/types/workspace';
import useDocketState from '~/logic/state/docket';
import '~/views/apps/links/css/custom.css';
import '~/views/apps/publish/css/custom.css';
import { Skeleton } from '../Skeleton';
import { EXCLUDED_DESKS } from '../Sidebar/MyApps';
import { Tile } from './AppTile';
import { Box, Col, Row, Text } from '@tlon/indigo-react';
import { IS_MOBILE } from '~/logic/lib/platform';

interface AppsPaneProps {
  baseUrl: string;
  workspace: Workspace;
}

export function AppsPane(props: AppsPaneProps) {
  const { baseUrl } = props;
  const relativePath = (path: string) => baseUrl + path;
  const { charges } = useDocketState.getState();
  const chargesList = Object.values(charges).filter(({ desk }) => !EXCLUDED_DESKS.includes(desk));

  return (
    <Switch>
      <Route
        path={relativePath('/new')}
        render={({ history }) => {
          return (
            <Skeleton mobileHide recentGroups={[]} {...props} baseUrl={baseUrl}>
              <Col height="100%" width="100%">
                {IS_MOBILE && (
                  <Box p={2} onClick={() => history.push(props?.baseUrl ?? '/')}>
                    <Text>{'<- Back'}</Text>
                  </Box>
                )}
                <Col p={4}>
                  <Text fontWeight={600}>Recommended Apps</Text>
                  <Text>This section is still under development.</Text>
                  <Text>We recommended installing new apps from Grid.</Text>
                </Col>
              </Col>
            </Skeleton>
          );
        }}
      />
      <Route
        path={relativePath('/app')}
        render={({ history, match }) => {
          const params = new URLSearchParams(window.location.search);
          const app = params.get('app');

          if (!app) {
            alert('There was an issue opening the app.');
            history.goBack();
          }

          const url = `${window.location.origin}${decodeURIComponent(app)}?embedded=true`;

          return (
            <Skeleton
              mobileHide
              recentGroups={[]}
              selected={app}
              {...props}
              baseUrl={match.path}
            >
              <Col height="100%" width="100%">
                {IS_MOBILE && (
                  <Box p={2} onClick={() => history.push(props?.baseUrl ?? '/')}>
                    <Text>{'<- Back'}</Text>
                  </Box>
                )}
                <iframe src={url} style={{
                  height: `calc(100% - ${IS_MOBILE ? 36 : 4}px)`,
                  width: 'calc(100% - 4px)',
                  borderTopRightRadius: 4,
                  borderBottomRightRadius: 4
                  }}
                />
              </Col>
            </Skeleton>
          );
        }}
      />
      <Route
        path={relativePath('/')}
        render={(routeProps) => {
          return (
            <>
              <Helmet defer={false}>
                <title>My Apps</title>
              </Helmet>
              <Skeleton
                {...props}
                mobileHide={false}
                recentGroups={[]}
                baseUrl={baseUrl}
              >
                <Row flexWrap="wrap">
                  {chargesList.map(charge => (
                    <Tile key={charge.desk} desk={charge.desk} charge={charge} />
                  ))}
                </Row>
              </Skeleton>
            </>
          );
        }}
      />
    </Switch>
  );
}
