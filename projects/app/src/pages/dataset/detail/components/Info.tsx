import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { Box, Flex, Button, IconButton, Input, Textarea } from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons';
import { delDatasetById } from '@/web/core/dataset/api';
import { useSelectFile } from '@/web/common/file/hooks/useSelectFile';
import { useDatasetStore } from '@/web/core/dataset/store/dataset';
import { useConfirm } from '@fastgpt/web/hooks/useConfirm';
import { useForm } from 'react-hook-form';
import { compressImgFileAndUpload } from '@/web/common/file/controller';
import type { DatasetItemType } from '@fastgpt/global/core/dataset/type.d';
import Avatar from '@/components/Avatar';
import MyTooltip from '@/components/MyTooltip';
import { useTranslation } from 'next-i18next';
import PermissionRadio from '@/components/support/permission/Radio';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import { useRequest } from '@fastgpt/web/hooks/useRequest';
import { MongoImageTypeEnum } from '@fastgpt/global/common/file/image/constants';
import AIModelSelector from '@/components/Select/AIModelSelector';
import { postRebuildEmbedding } from '@/web/core/dataset/api';
import { useI18n } from '@/web/context/I18n';
import type { VectorModelItemType } from '@fastgpt/global/core/ai/model.d';
import { useContextSelector } from 'use-context-selector';
import { DatasetPageContext } from '@/web/core/dataset/context/datasetPageContext';
import MyDivider from '@fastgpt/web/components/common/MyDivider/index';

const Info = ({ datasetId }: { datasetId: string }) => {
  const { t } = useTranslation();
  const { datasetT } = useI18n();
  const { datasetDetail, loadDatasetDetail, loadDatasets, updateDataset } = useDatasetStore();
  const rebuildingCount = useContextSelector(DatasetPageContext, (v) => v.rebuildingCount);
  const trainingCount = useContextSelector(DatasetPageContext, (v) => v.trainingCount);
  const refetchDatasetTraining = useContextSelector(
    DatasetPageContext,
    (v) => v.refetchDatasetTraining
  );

  const { setValue, register, handleSubmit, watch } = useForm<DatasetItemType>({
    defaultValues: datasetDetail
  });

  const avatar = watch('avatar');
  const vectorModel = watch('vectorModel');
  const agentModel = watch('agentModel');
  const permission = watch('permission');

  const { datasetModelList, vectorModelList } = useSystemStore();

  const router = useRouter();

  const { openConfirm: onOpenConfirmDel, ConfirmModal: ConfirmDelModal } = useConfirm({
    content: t('core.dataset.Delete Confirm'),
    type: 'delete'
  });
  const { openConfirm: onOpenConfirmRebuild, ConfirmModal: ConfirmRebuildModal } = useConfirm({
    title: t('common.confirm.Common Tip'),
    content: datasetT('Confirm to rebuild embedding tip'),
    type: 'delete'
  });

  const { File, onOpen: onOpenSelectFile } = useSelectFile({
    fileType: '.jpg,.png',
    multiple: false
  });

  /* 点击删除 */
  const { mutate: onclickDelete, isLoading: isDeleting } = useRequest({
    mutationFn: () => {
      return delDatasetById(datasetId);
    },
    onSuccess() {
      router.replace(`/dataset/list`);
    },
    successToast: t('common.Delete Success'),
    errorToast: t('common.Delete Failed')
  });

  const { mutate: onclickSave, isLoading: isSaving } = useRequest({
    mutationFn: (data: DatasetItemType) => {
      return updateDataset({
        id: datasetId,
        ...data
      });
    },
    onSuccess() {
      loadDatasets();
    },
    successToast: t('common.Update Success'),
    errorToast: t('common.Update Failed')
  });

  const { mutate: onSelectFile, isLoading: isSelecting } = useRequest({
    mutationFn: (e: File[]) => {
      const file = e[0];
      if (!file) return Promise.resolve(null);
      return compressImgFileAndUpload({
        type: MongoImageTypeEnum.datasetAvatar,
        file,
        maxW: 300,
        maxH: 300
      });
    },
    onSuccess(src: string | null) {
      if (src) {
        setValue('avatar', src);
      }
    },
    errorToast: t('common.avatar.Select Failed')
  });

  const { mutate: onRebuilding, isLoading: isRebuilding } = useRequest({
    mutationFn: (vectorModel: VectorModelItemType) => {
      return postRebuildEmbedding({
        datasetId,
        vectorModel: vectorModel.model
      });
    },
    onSuccess() {
      refetchDatasetTraining();
      loadDatasetDetail(datasetId, true);
    },
    successToast: datasetT('Rebuild embedding start tip'),
    errorToast: t('common.Update Failed')
  });

  const btnLoading = isSelecting || isDeleting || isSaving || isRebuilding;

  return (
    <Box py={5} px={[5, 10]}>
      <Flex mt={5} w={'100%'} alignItems={'center'}>
        <Box flex={['0 0 90px', '0 0 160px']} w={0}>
          {t('core.dataset.Dataset ID')}
        </Box>
        <Box flex={1}>{datasetDetail._id}</Box>
      </Flex>
      <Flex mt={8} w={'100%'} alignItems={'center'} flexWrap={'wrap'}>
        <Box flex={['0 0 90px', '0 0 160px']} w={0}>
          {t('core.ai.model.Vector Model')}
        </Box>
        <Box flex={[1, '0 0 300px']}>
          <AIModelSelector
            w={'100%'}
            value={vectorModel.model}
            disableTip={
              rebuildingCount > 0 || trainingCount > 0
                ? datasetT('The knowledge base has indexes that are being trained or being rebuilt')
                : undefined
            }
            list={vectorModelList.map((item) => ({
              label: item.name,
              value: item.model
            }))}
            onchange={(e) => {
              const vectorModel = vectorModelList.find((item) => item.model === e);
              if (!vectorModel) return;
              onOpenConfirmRebuild(() => {
                setValue('vectorModel', vectorModel);
                onRebuilding(vectorModel);
              })();
            }}
          />
        </Box>
      </Flex>
      <Flex mt={8} w={'100%'} alignItems={'center'}>
        <Box flex={['0 0 90px', '0 0 160px']} w={0}>
          {t('core.Max Token')}
        </Box>
        <Box flex={[1, '0 0 300px']}>{vectorModel.maxToken}</Box>
      </Flex>
      <Flex mt={6} alignItems={'center'} flexWrap={'wrap'}>
        <Box flex={['0 0 90px', '0 0 160px']} w={0}>
          {t('core.ai.model.Dataset Agent Model')}
        </Box>
        <Box flex={[1, '0 0 300px']}>
          <AIModelSelector
            w={'100%'}
            value={agentModel.model}
            list={datasetModelList.map((item) => ({
              label: item.name,
              value: item.model
            }))}
            onchange={(e) => {
              const agentModel = datasetModelList.find((item) => item.model === e);
              if (!agentModel) return;
              setValue('agentModel', agentModel);
            }}
          />
        </Box>
      </Flex>

      <MyDivider my={4} h={'2px'} maxW={'500px'} />

      <Flex mt={5} w={'100%'} alignItems={'center'}>
        <Box flex={['0 0 90px', '0 0 160px']} w={0}>
          {t('core.dataset.Avatar')}
        </Box>
        <Box flex={[1, '0 0 300px']}>
          <MyTooltip label={t('common.avatar.Select Avatar')}>
            <Avatar
              m={'auto'}
              src={avatar}
              w={['32px', '40px']}
              h={['32px', '40px']}
              cursor={'pointer'}
              onClick={onOpenSelectFile}
            />
          </MyTooltip>
        </Box>
      </Flex>
      <Flex mt={8} w={'100%'} alignItems={'center'}>
        <Box flex={['0 0 90px', '0 0 160px']} w={0}>
          {t('core.dataset.Name')}
        </Box>
        <Input flex={[1, '0 0 300px']} maxLength={30} {...register('name')} />
      </Flex>
      <Flex mt={8} alignItems={'center'} w={'100%'}>
        <Box flex={['0 0 90px', '0 0 160px']}>{t('common.Intro')}</Box>
        <Textarea flex={[1, '0 0 300px']} {...register('intro')} placeholder={t('common.Intro')} />
      </Flex>
      {datasetDetail.isOwner && (
        <Flex mt={5} alignItems={'center'} w={'100%'} flexWrap={'wrap'}>
          <Box flex={['0 0 90px', '0 0 160px']} w={0}>
            {t('user.Permission')}
          </Box>
          <Box>
            <PermissionRadio
              value={permission}
              onChange={(e) => {
                setValue('permission', e);
              }}
            />
          </Box>
        </Flex>
      )}

      <Flex mt={5} w={'100%'} alignItems={'flex-end'}>
        <Box flex={['0 0 90px', '0 0 160px']} w={0}></Box>
        <Button
          isLoading={btnLoading}
          mr={4}
          w={'100px'}
          onClick={handleSubmit((data) => onclickSave(data))}
        >
          {t('common.Save')}
        </Button>
        {datasetDetail.isOwner && (
          <IconButton
            isLoading={btnLoading}
            icon={<DeleteIcon />}
            aria-label={''}
            variant={'whiteDanger'}
            size={'smSquare'}
            onClick={onOpenConfirmDel(onclickDelete)}
          />
        )}
      </Flex>

      <File onSelect={onSelectFile} />
      <ConfirmDelModal />
      <ConfirmRebuildModal countDown={10} />
    </Box>
  );
};

export default React.memo(Info);
