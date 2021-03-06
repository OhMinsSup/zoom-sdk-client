import axios from 'axios';
import isEmpty from 'lodash/isEmpty';
import queryString from 'query-string';
import type { ListMeetingResponse } from './model/list-meeting';
import type { WriteMeetingResponse } from './model/write-meeting';
import type { TokensResponse, UserResponse } from './model/user';
import type { ListFileResponse, UploadFileResponse } from './model/file';

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

export const serverURL: string =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:5000/api'
    : 'https://zoom-sdk-api.herokuapp.com/api';
export const clientURL: string =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : 'https://zoom-sdk.netlify.app';

const client = axios.create({
  baseURL: serverURL,
  withCredentials: true,
});

client.interceptors.response.use(
  (config) => config,
  // 오류 응답을 처리
  async (error) => {
    if (error.response.status === 401) {
      console.info('🚀 refreshing....');
      const { data, status } = await axios.post(`${serverURL}/auth/refresh`, {
        refreshToken: refreshTokenFn(),
      });

      if (status === 200) {
        const { accessToken, refreshToken } = data;
        accessTokenFn(accessToken);
        refreshTokenFn(refreshToken);
        console.log('🚀 refresh success...');
      }
    }

    return Promise.reject(error);
  },
);

export const AuthAPI = {
  tokens: () =>
    client
      .get<TokensResponse>('/auth/tokens')
      .then((res) => ({ ...res.data, status: res.status })),
  logout: () => client.post('/auth/logout', {}),
};

export const UserAPI = {
  user: () =>
    client
      .get<UserResponse>('/user/me', {
        headers: {
          Authorization: `Bearer ${accessTokenFn()}`,
        },
      })
      .then((res) => ({ ...res.data, status: res.status })),
};

export const RecordingAPI = {
  recordings: () =>
    client
      .get<ListFileResponse>('/recording', {
        headers: {
          Authorization: `Bearer ${accessTokenFn()}`,
        },
      })
      .then((res) => ({ ...res.data, status: res.status })),
  deleteRecording: (fileId: number) =>
    client
      .delete(`/recording/${fileId}`, {
        headers: {
          Authorization: `Bearer ${accessTokenFn()}`,
        },
      })
      .then((res) => ({ ...res.data, status: res.status })),
  uploadRecording: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await client.post<UploadFileResponse>(
      '/recording/upload',
      formData,
      {
        headers: {
          'Content-Type': ' multipart/form-data',
          Authorization: `Bearer ${accessTokenFn()}`,
        },
      },
    );

    return { ...res.data, status: res.status };
  },
};

export const MeetingAPI = {
  deleteMeeting: (meetingId: string) =>
    client
      .delete(`/meeting/${meetingId}`, {
        headers: {
          Authorization: `Bearer ${accessTokenFn()}`,
        },
      })
      .then((res) => ({ ...res.data, status: res.status })),
  createMeeting: (userId: string, body: any) =>
    client
      .post<WriteMeetingResponse>(`/meeting`, body, {
        headers: {
          Authorization: `Bearer ${accessTokenFn()}`,
        },
      })
      .then((res) => ({ ...res.data, status: res.status })),
  updateMeeting: (meetingId: string, body: any) =>
    client
      .put(`/meeting/${meetingId}`, body, {
        headers: {
          Authorization: `Bearer ${accessTokenFn()}`,
        },
      })
      .then((res) => ({ ...res.data, status: res.status })),
  detailMeeting: (meetingId: string) =>
    client
      .get<WriteMeetingResponse>(`/meeting/${meetingId}`, {
        headers: {
          Authorization: `Bearer ${accessTokenFn()}`,
        },
      })
      .then((res) => ({ ...res.data, status: res.status })),
  meetingUser: (userId: string, params?: any) =>
    client
      .get<ListMeetingResponse>(
        `/meeting?`.concat(
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

export const fileDownloadAPI = (
  data: any,
  filename: string,
  mime: string,
  bom?: any,
) => {
  const blobData = typeof bom !== 'undefined' ? [bom, data] : [data];
  const blob = new Blob(blobData, { type: mime || 'application/octet-stream' });
  if (typeof window.navigator.msSaveBlob !== 'undefined') {
    window.navigator.msSaveBlob(blob, filename);
  } else {
    const blobURL =
      window.URL && window.URL.createObjectURL
        ? window.URL.createObjectURL(blob)
        : window.webkitURL.createObjectURL(blob);
    const tempLink = document.createElement('a');
    tempLink.style.display = 'none';
    tempLink.href = blobURL;
    tempLink.setAttribute('download', filename);

    if (typeof tempLink.download === 'undefined') {
      tempLink.setAttribute('target', '_blank');
    }

    document.body.appendChild(tempLink);
    tempLink.click();

    // Fixes "webkit blob resource error 1"
    setTimeout(() => {
      document.body.removeChild(tempLink);
      window.URL.revokeObjectURL(blobURL);
    }, 200);
  }
};

export const browserFileDownloadAPI = (
  name: string,
  url: string,
  type: string,
) =>
  axios
    .get(url, {
      responseType: 'blob',
    })
    .then((response) => fileDownloadAPI(response.data, name, type))
    .catch(console.error);

export default client;
