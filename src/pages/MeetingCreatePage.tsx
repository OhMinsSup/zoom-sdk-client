import React from 'react';
import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation } from 'react-query';
import { useRecoilValue } from 'recoil';
import { useHistory } from 'react-router-dom';
import swal from 'sweetalert';
import { Helmet } from 'react-helmet-async';
import Header from '../components/common/Header';
import FormErrorMessage from '../components/common/FormErrorMessage';
import { MeetingAPI } from '../libs/api/client';
import { userState } from '../store/user';
import Button from '../components/common/Button';

const schema = yup.object().shape({
  topic: yup.string().optional(),
  type: yup.number().oneOf([1, 2]).default(1),
  start_time: yup.date().required('회의 시작 시간은 필수값입니다.'),
  timezone: yup.string().optional(),
  duration: yup.number().optional(),
  agenda: yup.string().optional(),
  password: yup
    .string()
    .matches(
      /^[a-z0-9-_@*]+$/,
      `비밀번호는 "/ ^ [a-z0-9 -_ @ *] + $ /"와 일치해야합니다.`,
    )
    .max(10)
    .required(),
});

interface FormFieldValue {
  topic: string;
  type: number;
  start_time: Date;
  timezone: string;
  password: string;
  agenda: string;
  duration?: number;
}

interface MeetingCreatePageProps {}
const MeetingCreatePage: React.FC<MeetingCreatePageProps> = () => {
  const history = useHistory();
  const state = useRecoilValue(userState);

  const mutation = useMutation<any, any, any, any>((data) =>
    MeetingAPI.createMeeting(state.user?.id!, data),
  );
  const {
    register,
    errors,
    watch,
    reset,
    clearErrors,
    getValues,
    handleSubmit,
  } = useForm<FormFieldValue>({
    mode: 'onChange',
    resolver: yupResolver(schema) as any,
    defaultValues: {
      topic: '',
      type: 1,
      timezone: 'Asia/Seoul',
      start_time: new Date().toISOString(),
      duration: 0,
      agenda: '',
      password: '',
    },
  });

  const onSubmit = async () => {
    clearErrors([
      'topic',
      'type',
      'start_time',
      'timezone',
      'password',
      'agenda',
      'duration',
    ]);
    const data = getValues();
    mutation.mutate({
      ...data,
      type: Number(data.type),
      ...(Number(data.type) === 2 && {
        duration: data.duration,
      }),
    });
  };

  React.useEffect(() => () => reset(), []);

  React.useEffect(() => {
    console.log(mutation.data);
    if (mutation.isSuccess) {
      swal({
        title: '미팅룸',
        text: '미팅룸 생성 완료!',
        icon: 'success',
      }).then(() => history.push(`/meeting/@${mutation.data.meeting.id}`));
    }
  }, [mutation.isSuccess]);

  return (
    <>
      <Helmet>
        <title>Meeting Create Page | Zoom SDK</title>
      </Helmet>
      <Header />
      <div className="min-h-screen w-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              미팅룸 생성
            </h2>
          </div>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="relative">
              <fieldset>
                <label className="block text-gray-800 mt-3 mb-1 font-sans font-bold">
                  토픽
                </label>
                <input
                  ref={register}
                  name="topic"
                  type="text"
                  placeholder="토픽"
                  className="input w-full mr-2"
                />
                {Boolean(errors.topic) && (
                  <FormErrorMessage msg={errors.topic?.message} />
                )}
              </fieldset>
            </div>

            <div className="relative">
              <fieldset>
                <label className="block text-gray-800 mt-3 mb-1 font-sans font-bold">
                  미팅 비밀번호
                </label>
                <input
                  ref={register}
                  name="password"
                  type="password"
                  placeholder="비밀번호"
                  className="w-full focus:outline-none focus:border-gray-500 p-3 border-2  text-lg border-gray-200 transition-colors"
                />
                {Boolean(errors.password) && (
                  <FormErrorMessage msg={errors.password?.message} />
                )}
              </fieldset>
            </div>

            <div className="relative">
              <fieldset>
                <label className="block text-gray-800 mt-3 mb-1 font-sans font-bold">
                  회의 시작시간
                </label>
                <input
                  ref={register}
                  name="start_time"
                  type="datetime-local"
                  placeholder="회의 시작시간"
                  className="w-full focus:outline-none focus:border-gray-500 p-3 border-2  text-lg border-gray-200 transition-colors"
                />
                {Boolean(errors.start_time) && (
                  <FormErrorMessage msg={errors.start_time?.message} />
                )}
              </fieldset>
            </div>

            <div className="relative">
              <fieldset>
                <label className="block text-gray-800 mt-3 mb-1 font-sans font-bold">
                  Timezone
                </label>
                <input
                  ref={register}
                  name="timezone"
                  type="text"
                  disabled
                  placeholder="Timezone"
                  className="w-full focus:outline-none focus:border-gray-500 p-3 border-2  text-lg border-gray-200 transition-colors"
                />
                {Boolean(errors.timezone) && (
                  <FormErrorMessage msg={errors.timezone?.message} />
                )}
              </fieldset>
            </div>

            <div className="relative">
              <fieldset>
                <label className="block text-gray-800 mt-3 mb-1 font-sans font-bold">
                  회의 타입
                </label>
                <select
                  ref={register}
                  name="type"
                  className="w-full focus:outline-none focus:border-gray-500 p-3 border-2  text-lg border-gray-200 transition-colors"
                >
                  <option value={1}>즉석 회의</option>
                  <option value={2}>예약 회의</option>
                </select>
              </fieldset>
            </div>

            {Number(watch('type')) === 2 && (
              <div className="relative">
                <fieldset>
                  <label className="block text-gray-800 mt-3 mb-1 font-sans font-bold">
                    회의시간
                  </label>
                  <input
                    ref={register}
                    name="duration"
                    type="text"
                    placeholder="회의시간"
                    className="w-full focus:outline-none focus:border-gray-500 p-3 border-2  text-lg border-gray-200 transition-colors"
                  />
                  {Boolean(errors.duration) && (
                    <FormErrorMessage msg={errors.duration?.message} />
                  )}
                </fieldset>
              </div>
            )}

            <div className="relative">
              <fieldset>
                <label className="block text-gray-800 mt-3 mb-1 font-sans font-bold">
                  설명
                </label>
                <input
                  ref={register}
                  name="agenda"
                  type="text"
                  placeholder="설명"
                  className="w-full focus:outline-none focus:border-gray-500 p-3 border-2  text-lg border-gray-200 transition-colors;"
                />
                {Boolean(errors.agenda) && (
                  <FormErrorMessage msg={errors.agenda?.message} />
                )}
              </fieldset>
            </div>

            <Button type="submit" size="large" className="w-full mt-6">
              미팅룸 생성
            </Button>
          </form>
        </div>
      </div>
    </>
  );
};

export default MeetingCreatePage;
