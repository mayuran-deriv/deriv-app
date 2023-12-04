import React, { ComponentProps, InputHTMLAttributes, lazy, Suspense } from 'react';

const WalletPasswordFieldLazyContainer = lazy(
    () => import('./WalletPasswordField')
) as React.FC<WalletPasswordFieldProps>;

export type HelperMessageProps = {
    inputValue?: InputHTMLAttributes<HTMLInputElement>['value'];
    isError?: boolean;
    maxLength?: InputHTMLAttributes<HTMLInputElement>['maxLength'];
    message?: string;
    messageVariant?: 'error' | 'general' | 'warning';
};

export interface WalletTextFieldProps extends ComponentProps<'input'>, HelperMessageProps {
    defaultValue?: string;
    disabled?: boolean;
    errorMessage?: string[] | string;
    isInvalid?: boolean;
    label?: string;
    renderLeftIcon?: () => React.ReactNode;
    renderRightIcon?: () => React.ReactNode;
    showMessage?: boolean;
}

interface WalletPasswordFieldProps extends WalletTextFieldProps {
    password: string;
    shouldDisablePasswordMeter?: boolean;
}
// now export whole component as defult lazy loaded
const WalletPasswordFieldLazy: React.FC<WalletPasswordFieldProps> = props => (
    <Suspense fallback={<div>...loading</div>}>
        <WalletPasswordFieldLazyContainer {...props} />
    </Suspense>
);

export default WalletPasswordFieldLazy;
