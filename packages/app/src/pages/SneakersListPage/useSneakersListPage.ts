import { useMemo, useCallback } from 'react';
import _ from 'lodash';
import useAxios from 'axios-hooks';
import { useRouter } from 'next/router';

import { sortOptionKeys } from './constants.SneakersListPage';
import { HookData, Callbacks, JsonServerParams } from './types.SneakersListPage';

const createSortParams = () : {
  [key: string]: JsonServerParams,
}  => {
  return {
    [sortOptionKeys.POPULAR]: {},
    [sortOptionKeys.NEW]: { _sort: 'release_date_unix', _order: 'desc' },
    [sortOptionKeys.UPCOMING]: { _sort: 'release_date_unix', _order: 'asc', release_date_unix_gte: Math.round(Date.now() / 1000) },
    [sortOptionKeys.PRICE_LOW_HIGH]: { _sort: 'retail_price_cents', _order: 'asc', retail_price_cents_ne: 'null' },
    [sortOptionKeys.PRICE_HIGH_LOW]: { _sort: 'retail_price_cents', _order: 'desc', retail_price_cents_ne: 'null' },
  };
}

const useSneakersListPage = (): [HookData, Callbacks] => {
  const router = useRouter();
  const sortParams = useMemo(createSortParams, []);
  const sortBy = _.get(router, 'query.sortBy', sortOptionKeys.POPULAR);
  const params = useMemo((): JsonServerParams => {
    return {
      _limit: 24,
      _start: 0,
      ...sortParams[sortBy],
    };
  }, [sortBy]);

  const [{ data, loading, response }, refetch] = useAxios({
    url: '/sneakers',
    params,
  });

  const totalCount = _.get(response, 'headers.x-total-count', 0);

  const onSortByChange = useCallback((event) => {
    const path = `/?sortBy=${event.target.value}`;
    router.push(path, path, { shallow: true });
  }, [router]);

  const onSeeMore = useCallback(() => {
    refetch({
      params: {
        ...params,
        _start: data.length,
      },
      transformResponse: (responseData) => {
        const newSneakers = JSON.parse(responseData);
        return _.concat(data, newSneakers);
      },
    })
  }, [data]);

  return [{
    totalCount,
    sneakers: data,
    sortBy,
    loading,
  }, {
    onSortByChange,
    onSeeMore,
  }];
};

export default useSneakersListPage;
