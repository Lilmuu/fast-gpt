import React, { useCallback, useState } from 'react';
import { Box, Grid, Flex, IconButton, Button, useDisclosure, Image } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import { AddIcon } from '@chakra-ui/icons';
import { delModelById } from '@/web/core/app/api';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { useConfirm } from '@fastgpt/web/hooks/useConfirm';
import { serviceSideProps } from '@/web/common/utils/i18n';
import MyIcon from '@fastgpt/web/components/common/Icon';
import PageContainer from '@/components/PageContainer';
import Avatar from '@/components/Avatar';
import MyTooltip from '@/components/MyTooltip';
import CreateModal from './component/CreateModal';
import { useAppStore } from '@/web/core/app/store/useAppStore';
import PermissionIconText from '@/components/support/permission/IconText';
import { useUserStore } from '@/web/support/user/useUserStore';
import { useI18n } from '@/web/context/I18n';

const MyApps = () => {
  const { toast } = useToast();
  const { appT, commonT } = useI18n();

  const router = useRouter();
  const { userInfo } = useUserStore();
  const { myApps, loadMyApps } = useAppStore();
  const { openConfirm, ConfirmModal } = useConfirm({
    title: '删除提示',
    content: '确认删除该应用所有信息？'
  });
  const {
    isOpen: isOpenCreateModal,
    onOpen: onOpenCreateModal,
    onClose: onCloseCreateModal
  } = useDisclosure();

  /* 点击删除 */
  const onclickDelApp = useCallback(
    async (id: string) => {
      try {
        await delModelById(id);
        toast({
          title: '删除成功',
          status: 'success'
        });
        loadMyApps(true);
      } catch (err: any) {
        toast({
          title: err?.message || '删除失败',
          status: 'error'
        });
      }
    },
    [toast, loadMyApps]
  );

  /* 加载模型 */
  const { isFetching } = useQuery(['loadApps'], () => loadMyApps(true), {
    refetchOnMount: true
  });
  const [hoverIndex, setHoverIndex] = useState<string>()

  return (
    <PageContainer isLoading={isFetching} insertProps={{ px: [5, '32px'], bg: 'url(/icon/containerBg.png) no-repeat 0 0 / 100% 100%' }}>
      <Flex pt={[4, '44px']} pb={'40px'} alignItems={'center'} justifyContent={'space-between'}>
        <Flex flex={1} justifyContent={'space-between'} alignItems={'center'}>
          <Flex flexFlow={'column'}>
            <Box letterSpacing={1} fontSize={'40px'} color={'rgba(51, 112, 255, 1)'} fontWeight={'bold'}>
              {appT('My Apps')}
            </Box>
            <Box letterSpacing={1} fontSize={'36px'} fontWeight={'bold'}>
              {appT('My Apps Intro')}
            </Box>
          </Flex>
          <Image src={'/imgs/workflow/db.png'} alt={''} mr={'64px'} h={'176px'} w={'196px'} />
        </Flex>
        <Button leftIcon={<AddIcon />} variant={'primaryOutline'} onClick={onOpenCreateModal} width={'88px'} height={'32px'} background={'linear-gradient(131.62deg, rgba(51, 112, 255, 1) 0%, rgba(130, 168, 255, 1) 100%);'} color={'#fff'} _hover={{
          background: 'linear-gradient(131.62deg, rgba(51, 112, 255, 1) 0%, rgba(130, 168, 255, 1) 100%);'
        }}>
          {commonT('New Create')}
        </Button>
      </Flex>
      <Grid
        py={[4, 6]}
        gridTemplateColumns={['1fr', 'repeat(2,1fr)', 'repeat(3,1fr)', 'repeat(4,1fr)']}
        gridGap={5}
      >
        {myApps.map((app) => (
          <MyTooltip
            key={app._id}
            label={userInfo?.team.canWrite ? appT('To Settings') : appT('To Chat')}
          >
            <Box
              lineHeight={1.5}
              h={'100%'}
              py={3}
              px={5}
              cursor={'pointer'}
              borderWidth={'1.5px'}
              borderColor={'borderColor.low'}
              bg={'white'}
              borderRadius={'16px'}
              userSelect={'none'}
              position={'relative'}
              display={'flex'}
              flexDirection={'column'}
              onMouseEnter={() => {
                setHoverIndex(app._id)
              }}
              onMouseLeave={() => {
                setHoverIndex('')
              }}
              style={hoverIndex === app._id ? { color: '#fff' } : {}}
              _hover={{
                // borderColor: 'primary.300',
                // boxShadow: '1.5',
                background: 'linear-gradient(131.62deg, rgba(51, 112, 255, 1) 0%, rgba(130, 168, 255, 1) 100%);',
                '& .delete': {
                  display: 'flex'
                },
                '& .chat': {
                  display: 'flex'
                }
              }}
              onClick={() => {
                if (userInfo?.team.canWrite) {
                  router.push(`/app/detail?appId=${app._id}`);
                } else {
                  router.push(`/chat?appId=${app._id}`);
                }
              }}
            >
              <Flex alignItems={'center'} h={'38px'}>
                <Avatar src={app.avatar} borderRadius={'md'} w={'28px'} />
                <Box ml={3}>{app.name}</Box>
                {app.isOwner && userInfo?.team.canWrite && (
                  <IconButton
                    className="delete"
                    position={'absolute'}
                    top={4}
                    right={4}
                    size={'xsSquare'}
                    variant={'whiteDanger'}
                    icon={<MyIcon name={'delete'} w={'14px'} />}
                    aria-label={'delete'}
                    display={['', 'none']}
                    _hover={{
                      background: '#fff'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      openConfirm(() => onclickDelApp(app._id))();
                    }}
                  />
                )}
              </Flex>
              <Box
                flex={1}
                className={'textEllipsis3'}
                py={2}
                wordBreak={'break-all'}
                fontSize={'sm'}
                color={'rgba(51, 112, 255, 1)'}
                style={hoverIndex === app._id ? { color: '#fff' } : {}}
              >
                {app.intro || '这个应用还没写介绍~'}
              </Box>
              <Flex h={'34px'} alignItems={'flex-end'}>
                <Box flex={1}>
                  <PermissionIconText permission={app.permission} color={'myGray.600'} style={hoverIndex === app._id ? { color: '#fff' } : {}} />
                </Box>
                {userInfo?.team.canWrite && (
                  <IconButton
                    className="chat"
                    size={'xsSquare'}
                    variant={'whitePrimary'}
                    _hover={{
                      background: '#fff'
                    }}
                    icon={
                      <MyTooltip label={'去聊天'}>
                        <MyIcon name={'core/chat/chatLight2'} w={'14px'} />
                      </MyTooltip>
                    }
                    aria-label={'chat'}
                    display={['', 'none']}
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/chat?appId=${app._id}`);
                    }}
                  />
                )}
              </Flex>
            </Box>
          </MyTooltip>
        ))}
      </Grid>

      {myApps.length === 0 && (
        <Flex mt={'35vh'} flexDirection={'column'} alignItems={'center'}>
          <MyIcon name="empty" w={'48px'} h={'48px'} color={'transparent'} />
          <Box mt={2} color={'myGray.500'}>
            还没有应用，快去创建一个吧！
          </Box>
        </Flex>
      )}
      <ConfirmModal />
      {isOpenCreateModal && (
        <CreateModal onClose={onCloseCreateModal} onSuccess={() => loadMyApps(true)} />
      )}
    </PageContainer>
  );
};

export async function getServerSideProps(content: any) {
  return {
    props: {
      ...(await serviceSideProps(content, ['app']))
    }
  };
}

export default MyApps;
