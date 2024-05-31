import React, { useState, Dispatch, useCallback } from 'react';
import {
  FormControl, Flex, Input, Button, Box, Link,
  Modal,
  ModalOverlay,
  ModalBody,
  ModalFooter,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  useDisclosure
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { LoginPageTypeEnum } from '@/web/support/user/login/constants';
import { postLogin } from '@/web/support/user/api';
import type { ResLogin } from '@/global/support/api/userRes';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import { getDocPath } from '@/web/common/system/doc';
import { useTranslation } from 'next-i18next';
import FormLayout from './components/FormLayout';
import Privacy from './privacy'
import Terms from './terms'

interface Props {
  setPageType: Dispatch<`${LoginPageTypeEnum}`>;
  loginSuccess: (e: ResLogin) => void;
}

interface LoginFormType {
  username: string;
  password: string;
}

const LoginForm = ({ setPageType, loginSuccess }: Props) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { feConfigs } = useSystemStore();
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormType>();

  const [requesting, setRequesting] = useState(false);

  const onclickLogin = useCallback(
    async ({ username, password }: LoginFormType) => {
      setRequesting(true);
      try {
        loginSuccess(
          await postLogin({
            username,
            password
          })
        );
        toast({
          title: '登录成功',
          status: 'success'
        });
      } catch (error: any) {
        toast({
          title: error.message || '登录异常',
          status: 'error'
        });
      }
      setRequesting(false);
    },
    [loginSuccess, toast]
  );

  const isCommunityVersion = feConfigs?.show_register === false && !feConfigs?.isPlus;

  const loginOptions = [
    feConfigs?.show_phoneLogin ? t('support.user.login.Phone number') : '',
    feConfigs?.show_emailLogin ? t('support.user.login.Email') : '',
    t('support.user.login.Username')
  ].filter(Boolean);

  const placeholder = isCommunityVersion
    ? t('support.user.login.Root login')
    : loginOptions.join('/');

  const { isOpen, onOpen, onClose } = useDisclosure()

  const [modalStatus, setModaStatus] = React.useState('')
  return (
    <FormLayout setPageType={setPageType} pageType={LoginPageTypeEnum.passwordLogin}>
      <Box
        mt={'42px'}
        onKeyDown={(e) => {
          if (e.keyCode === 13 && !e.shiftKey && !requesting) {
            handleSubmit(onclickLogin)();
          }
        }}
      >
        <FormControl isInvalid={!!errors.username}>
          <Input
            bg={'myGray.50'}
            placeholder={placeholder}
            {...register('username', {
              required: true
            })}
          ></Input>
        </FormControl>
        <FormControl mt={6} isInvalid={!!errors.password}>
          <Input
            bg={'myGray.50'}
            type={'password'}
            placeholder={
              isCommunityVersion
                ? t('support.user.login.Root password placeholder')
                : t('support.user.login.Password')
            }
            {...register('password', {
              required: true,
              maxLength: {
                value: 60,
                message: '密码最多 60 位'
              }
            })}
          ></Input>
        </FormControl>
        {feConfigs?.docUrl && (
          <Flex alignItems={'center'} mt={7} fontSize={'sm'}>
            {t('support.user.login.Policy tip')}
            {/* <Link
              ml={1}
              href={getDocPath('/docs/agreement/terms/')}
              target={'_blank'}
              color={'primary.500'}
            >
              {t('support.user.login.Terms')}
            </Link> */}
            <span
              onClick={() => {
                setModaStatus('Terms')
                onOpen()
              }}
              style={{ marginLeft: '0.25rem', color: '#487fff', cursor: 'pointer' }}
            >
              {t('support.user.login.Terms')}
            </span>
            <Box mx={1}>{t('support.user.login.And')}</Box>
            {/* <Link
              href={getDocPath('/docs/agreement/privacy/')}
              target={'_blank'}
              color={'primary.500'}
            >
              {t('support.user.login.Privacy')}
            </Link> */}
            <span
              onClick={() => {
                setModaStatus('Privacy')
                onOpen()
              }}
              style={{ marginLeft: '0.25rem', color: '#487fff', cursor: 'pointer' }}
            >
              {t('support.user.login.Privacy')}
            </span>
          </Flex>
        )}

        <Button
          type="submit"
          my={6}
          w={'100%'}
          size={['md', 'lg']}
          colorScheme="blue"
          isLoading={requesting}
          onClick={handleSubmit(onclickLogin)}
        >
          {t('Login')}
        </Button>

        {feConfigs?.show_register && (
          <>
            <Flex align={'center'} justifyContent={'flex-end'} color={'primary.700'}>
              <Box
                cursor={'pointer'}
                _hover={{ textDecoration: 'underline' }}
                onClick={() => setPageType('forgetPassword')}
                fontSize="sm"
              >
                {t('support.user.login.Forget Password')}
              </Box>
              <Box mx={3} h={'16px'} w={'1.5px'} bg={'myGray.250'}></Box>
              <Box
                cursor={'pointer'}
                _hover={{ textDecoration: 'underline' }}
                onClick={() => setPageType('register')}
                fontSize="sm"
              >
                {t('support.user.login.Register')}
              </Box>
            </Flex>
          </>
        )}
      </Box>
      <Modal size={'xl'} onClose={onClose} isOpen={isOpen} isCentered scrollBehavior={'inside'}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{modalStatus == 'Terms' ? t('support.user.login.Terms') : t('support.user.login.Privacy')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {modalStatus == 'Terms' ? <Terms></Terms> : <Privacy></Privacy>}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>确定</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </FormLayout>
  );
};

export default LoginForm;
