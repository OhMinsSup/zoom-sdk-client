import React from 'react';
import styled from 'styled-components';
import palette from '../../libs/styles/palette';
import PlainNavLink from '../common/PlainNavLink';

interface UserTabProps {
  id: string;
  tab: 'meetings' | 'meeting' | 'my';
}

const tabIndexMap = {
  meetings: 0,
  meeting: 2,
  my: 1,
};

const UserTab: React.FC<UserTabProps> = ({ id, tab }) => {
  const url = `/@${id}`;
  const withPrefix = (path: string) => `${url}/${path}`;
  const tabIndex = tabIndexMap[tab];

  console.log('user');
  return (
    <div className="flex my-20 justify-center">
      <div className="flex relative">
        <TabItem exact to={url}>
          미팅룸
        </TabItem>
        <TabItem exact to={withPrefix('my')}>
          내정보
        </TabItem>
        <Indicator
          style={{
            // left: `${tabIndex * 33.3333}%`,
            left: `${tabIndex * 50}%`,
          }}
        />
      </div>
    </div>
  );
};

export default UserTab;

const TabItem = styled(PlainNavLink)`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.325rem;
  width: 8rem;
  height: 3rem;
  color: ${palette.gray7};
  text-decoration: none;
  transition: 0.25s color ease-in-out;
  font-weight: 600;
  &.active {
    color: ${palette.teal5};
    /* font-weight: bold; */
  }
`;

const Indicator = styled.div`
  width: 8rem;
  height: 2px;
  background: ${palette.teal5};
  position: absolute;
  bottom: -2px;
  transition: 0.25s left ease-in-out;
`;
