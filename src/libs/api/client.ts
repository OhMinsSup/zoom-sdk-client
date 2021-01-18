import axios from 'axios';
import jwt from 'jsonwebtoken';
import isEmpty from 'lodash/isEmpty';
import queryString from 'query-string';
import type { ListMeetingResponse } from './model/list-meeting';
import type { WriteMeetingResponse } from './model/write-meeting';
import type { TokensResponse, UserResponse } from './model/user';

export const userFn = (user?: any) =>
  user
    ? localStorage.setItem('@zoom::user', JSON.stringify(user))
    : JSON.parse(localStorage.getItem('@zoom::user')!) || null;

export const accessTokenFn = (token?: string) =>
  token
    ? localStorage.setItem('@zoom::accessToken', token)
    : localStorage.getItem('@zoom::accessToken') || '';

export const refreshTokenFn = (token?: string) =>
  token
    ? localStorage.setItem('@zoom::refreshToken', token)
    : localStorage.getItem('@zoom::refreshToken') || '';

const baseURL: string = 'http://localhost:5000/api';

const client = axios.create({
  baseURL,
  withCredentials: true,
});

client.interceptors.request.use(
  async (config) => {
    // 요청을 보내기 전에 수행할 일
    // authorization이 헤더 안에 있는지 확인
    console.log('header prev');
    if (!('authorization' in config.headers)) {
      console.log('header inner');
      // 없으면 바로 요청
      return config;
    }
    console.log('header next');

    // 있으면 해당 accessToken의 만료일을 체크
    const { authorization } = config.headers;
    const accessToken = authorization.split(' ')[1];

    // zoom accessToken 1시간이 만료시간
    const { exp } = jwt.decode(accessToken) as { exp: number };
    const diff = exp * 1000 - new Date().getTime();
    // 해당 기능에서는 만료시간이 40분이면 다시 refresh하게 변경
    if (diff < 1000 * 60 * 40) {
      console.info('refreshing....');
      const { data, status } = await axios.post(`${baseURL}/auth/refresh`, {
        refreshToken: refreshTokenFn(),
      });

      if (status === 200) {
        // 재발급이 성공하면 token값을 수정하고 다시 request를 보냄
        const { accesToken, refreshToken } = data;
        accessTokenFn(accesToken);
        refreshTokenFn(refreshToken);
        // eslint-disable-next-line no-param-reassign
        config.headers.authorization = `Bearer ${accesToken}`;
        return config;
      }
    }
    // 실패하거난 잘못된 요청은 일단 서버로 보냄
    return config;
  },
  // 오류 응답을 처리
  (error) => Promise.reject(error),
);

export const AuthAPI = {
  tokens: () =>
    client
      .get<TokensResponse>('/auth/tokens')
      .then((res) => ({ ...res.data, status: res.status })),
  logout: () =>
    client
      .post(
        '/auth/logout',
        {},
        {
          headers: {
            Authorization: `Bearer ${accessTokenFn()}`,
          },
        },
      )
      .then(() => {
        localStorage.removeItem('@zoom::accessToken');
        localStorage.removeItem('@zoom::refreshToken');
        localStorage.removeItem('@zoom::user');
      }),
};

export const UserAPI = {
  user: () =>
    client
      .get<UserResponse>('/user/', {
        headers: {
          Authorization: `Bearer ${accessTokenFn()}`,
        },
      })
      .then((res) => ({ ...res.data, status: res.status })),
};

export const MeetingAPI = {
  createMeeting: (userId: string, body: any) =>
    client.post<WriteMeetingResponse>(`/meeting/${userId}`, body, {
      headers: {
        Authorization: `Bearer ${accessTokenFn()}`,
      },
    }),
  meetingUser: (userId: string, params?: any) =>
    client
      .get<ListMeetingResponse>(
        `/meeting/${userId}?`.concat(
          isEmpty(params) ? '' : queryString.stringify(params),
        ),
        {
          headers: {
            Authorization: `Bearer ${accessTokenFn()}`,
          },
        },
      )
      .then((res) => ({ ...res.data, status: res.status })),
};

export default client;
