import React from 'react';
import { ZoomMtg as ZoomMtgType } from '@zoomus/websdk';
import { useHistory } from 'react-router-dom';

declare const ZoomMtg: typeof ZoomMtgType;

const b64EncodeUnicode = (str: string) =>
  btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(`0x${p1}` as any),
    ),
  );

interface MeetingPageProps {}
const MeetingPage: React.FC<MeetingPageProps> = () => {
  const history = useHistory();

  React.useEffect(() => {
    const stringify = localStorage.getItem('@@zoom');
    if (stringify) {
      const json = JSON.parse(stringify);

      ZoomMtg.init({
        leaveUrl: 'http://localhost:4000',
        success: () => {
          ZoomMtg.i18n.load(json.lang);
          ZoomMtg.i18n.reload(json.lang);

          ZoomMtg.join({
            meetingNumber: json.meetingNumber,
            signature: json.signature,
            userName: b64EncodeUnicode(json.displayName),
            apiKey: json.apiKey,
            passWord: json.password,
            userEmail: json.email,
            success: (joinRes: any) => {
              console.log('success joinRes', joinRes);
              ZoomMtg.getAttendeeslist({});
              ZoomMtg.getCurrentUser({
                success: (res: any) => {
                  console.log('success getCurrentUser', res.result.currentUser);
                },
              });
            },
            error: (error: any) => {
              console.error(error);
            },
          });
        },
        error: (error: any) => {
          console.error(error);
        },
      });
    } else {
      history.goBack();
    }
  }, []);

  return <div>MeetingPage</div>;
};

export default MeetingPage;
