import React from 'react';
import { InfiniteDataList, Loading, Table, Text } from '@deriv-app/components';
import { observer, useStore } from '@deriv-app/stores';
import { Localize } from 'Components/i18next';
// @ts-ignore
import { useStores } from 'Stores';
import BlockUserEmpty from '../block-user-empty';
import BlockUserRow from './block-user-row';

const BlockUserTable = () => {
    const { my_profile_store } = useStores();
    const {
        ui: { is_mobile },
    } = useStore();

    React.useEffect(() => {
        my_profile_store.setTradePartnersList([]);
        my_profile_store.getTradePartnersList({ startIndex: 0 }, true);
        my_profile_store.setSearchTerm('');

        return () => {
            my_profile_store.setTradePartnersList([]);
            my_profile_store.setSearchTerm('');
            my_profile_store.setSearchResults([]);
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (my_profile_store.is_block_user_table_loading) {
        return <Loading is_fullscreen={is_mobile} />;
    }

    if (my_profile_store.search_term && my_profile_store.rendered_trade_partners_list.length === 0) {
        return (
            <Text align='center' className='block-user-table__text' weight={is_mobile ? 'normal' : 'bold'}>
                <Localize i18n_default_text='There are no matching name.' />
            </Text>
        );
    }

    if (my_profile_store.rendered_trade_partners_list.length) {
        return (
            <Table className='block-user-table'>
                <Table.Body className='block-user-table__body'>
                    <InfiniteDataList
                        data_list_className='block-use-table__data-list'
                        has_filler
                        has_more_items_to_load={my_profile_store.has_more_items_to_load}
                        items={my_profile_store.rendered_trade_partners_list}
                        keyMapperFn={item => item.id}
                        loadMoreRowsFn={my_profile_store.getTradePartnersList}
                        // @ts-ignore
                        rowRenderer={props => <BlockUserRow {...props} />}
                    />
                </Table.Body>
            </Table>
        );
    }

    return <BlockUserEmpty />;
};

export default observer(BlockUserTable);
