import React from 'react';
import { useTheme, type BoxProps } from '@chakra-ui/react';
import MyBox from '@fastgpt/web/components/common/MyBox';

const PageContainer = ({
  children,
  isLoading,
  insertProps = {},
  ...props
}: BoxProps & { isLoading?: boolean; insertProps?: BoxProps }) => {
  const theme = useTheme();
  return (
    <MyBox h={'100%'} py={[0, '16px']} pr={[0, '16px']} {...props}>
      <MyBox
        isLoading={isLoading}
        h={'100%'}
        borderColor={'rgba(255, 255, 255, 1)'}
        borderWidth={[0, 2]}
        // boxShadow={'1.5'}
        overflow={'overlay'}
        bg={'rgba(255, 255, 255, 0.5)'}
        borderRadius={[0, '24px']}
        {...insertProps}
      >
        {children}
      </MyBox>
    </MyBox>
  );
};

export default PageContainer;
