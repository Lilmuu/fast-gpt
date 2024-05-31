import { InitChatResponse } from './api';

export const defaultChatData: InitChatResponse = {
  chatId: '',
  appId: '',
  app: {
    name: 'Loading',
    avatar: '/icon/logo.png',
    intro: '',
    canUse: false
  },
  title: '新对话',
  variables: {},
  history: []
};
