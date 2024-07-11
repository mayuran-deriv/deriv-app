import React from 'react';
import { DesktopWrapper, Icon, MobileFullPageModal, MobileWrapper, Text } from '@deriv-app/components';
import { observer } from '@deriv-app/stores';
import { Localize, localize } from 'Components/i18next';
import SeparatorContainerLine from 'Components/separator-container-line';
import { my_profile_tabs } from 'Constants/my-profile-tabs';
// @ts-ignore
import { useStores } from 'Stores';
import MyProfileStatsTable from './my-profile-stats-table';
import MyProfilePrivacy from './my-profile-privacy';

const MyProfileStats = () => {
    const { my_profile_store } = useStores();
    const [should_show_stats_and_ratings, setShouldShowStatsAndRatings] = React.useState(false);
    const tabs = [
        {
            default_text: 'Stats',
            onClick: () => setShouldShowStatsAndRatings(true),
        },
        {
            default_text: 'Payment methods',
            onClick: () => my_profile_store.setActiveTab(my_profile_tabs.PAYMENT_METHODS),
        },
        {
            default_text: 'Ad details',
            onClick: () => my_profile_store.setActiveTab(my_profile_tabs.AD_TEMPLATE),
        },
        {
            default_text: 'My counterparties',
            onClick: () => my_profile_store.setActiveTab(my_profile_tabs.MY_COUNTERPARTIES),
        },
    ];

    return (
        <React.Fragment>
            <MobileFullPageModal
                height_offset='80px'
                is_flex
                is_modal_open={should_show_stats_and_ratings}
                onClickClose={() => {
                    // do nothing
                }}
                page_header_text={localize('Stats')}
                pageHeaderReturnFn={() => setShouldShowStatsAndRatings(false)}
            >
                <MyProfileStatsTable />
            </MobileFullPageModal>
            <DesktopWrapper>
                <MyProfileStatsTable />
            </DesktopWrapper>
            <MobileWrapper>
                <SeparatorContainerLine className='my-profile-stats__separator' />
                <MyProfilePrivacy />
                <SeparatorContainerLine className='my-profile-stats__separator' />
                {tabs.map((tab, key) => {
                    return (
                        <React.Fragment key={key}>
                            <div className='my-profile-stats__navigation' onClick={tab.onClick}>
                                <Text color='prominent' size='xxs'>
                                    <Localize i18n_default_text={tab.default_text} />
                                </Text>
                                <Icon icon='IcChevronRight' />
                            </div>
                            {key !== tabs.length - 1 && (
                                <SeparatorContainerLine className='my-profile-stats__separator' />
                            )}
                        </React.Fragment>
                    );
                })}
            </MobileWrapper>
        </React.Fragment>
    );
};

export default observer(MyProfileStats);
