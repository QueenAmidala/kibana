/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { SavedObjectsClientContract } from 'kibana/server';

import {
  SavedObjectType,
  exceptionListAgnosticSavedObjectType,
  exceptionListSavedObjectType,
} from '../../../common/types';
import { EmptyStringArrayDecoded } from '../../../common/schemas/types/empty_string_array';
import { NamespaceTypeArray } from '../../../common/schemas/types/default_namespace_array';
import { NonEmptyStringArrayDecoded } from '../../../common/schemas/types/non_empty_string_array';
import {
  ExceptionListSoSchema,
  FoundExceptionListItemSchema,
  Id,
  PageOrUndefined,
  PerPageOrUndefined,
  SortFieldOrUndefined,
  SortOrderOrUndefined,
} from '../../../common/schemas';

import { getSavedObjectTypes, transformSavedObjectsToFoundExceptionListItem } from './utils';
import { getExceptionList } from './get_exception_list';

interface FindExceptionListItemsOptions {
  listId: NonEmptyStringArrayDecoded;
  namespaceType: NamespaceTypeArray;
  savedObjectsClient: SavedObjectsClientContract;
  filter: EmptyStringArrayDecoded;
  perPage: PerPageOrUndefined;
  page: PageOrUndefined;
  sortField: SortFieldOrUndefined;
  sortOrder: SortOrderOrUndefined;
}

export const findExceptionListsItem = async ({
  listId,
  namespaceType,
  savedObjectsClient,
  filter,
  page,
  perPage,
  sortField,
  sortOrder,
}: FindExceptionListItemsOptions): Promise<FoundExceptionListItemSchema | null> => {
  const savedObjectType = getSavedObjectTypes({ namespaceType });
  const exceptionLists = (
    await Promise.all(
      listId.map((singleListId, index) => {
        return getExceptionList({
          id: undefined,
          listId: singleListId,
          namespaceType: namespaceType[index],
          savedObjectsClient,
        });
      })
    )
  ).filter((list) => list != null);
  if (exceptionLists.length === 0) {
    return null;
  } else {
    const savedObjectsFindResponse = await savedObjectsClient.find<ExceptionListSoSchema>({
      filter: getExceptionListsItemFilter({ filter, listId, savedObjectType }),
      page,
      perPage,
      sortField,
      sortOrder,
      type: savedObjectType,
    });
    return transformSavedObjectsToFoundExceptionListItem({
      savedObjectsFindResponse,
    });
  }
};

export const getExceptionListsItemFilter = ({
  filter,
  listId,
  savedObjectType,
}: {
  listId: NonEmptyStringArrayDecoded;
  filter: EmptyStringArrayDecoded;
  savedObjectType: SavedObjectType[];
}): string => {
  return listId.reduce((accum, singleListId, index) => {
    const listItemAppend = `(${savedObjectType[index]}.attributes.list_type: item AND ${savedObjectType[index]}.attributes.list_id: ${singleListId})`;
    const listItemAppendWithFilter =
      filter[index] != null ? `(${listItemAppend} AND ${filter[index]})` : listItemAppend;
    if (accum === '') {
      return listItemAppendWithFilter;
    } else {
      return `${accum} OR ${listItemAppendWithFilter}`;
    }
  }, '');
};

interface FindValueListExceptionListsItems {
  valueListId: Id;
  savedObjectsClient: SavedObjectsClientContract;
  perPage: PerPageOrUndefined;
  page: PageOrUndefined;
  sortField: SortFieldOrUndefined;
  sortOrder: SortOrderOrUndefined;
}

export const findValueListExceptionListItems = async ({
  valueListId,
  savedObjectsClient,
  page,
  perPage,
  sortField,
  sortOrder,
}: FindValueListExceptionListsItems): Promise<FoundExceptionListItemSchema | null> => {
  const savedObjectsFindResponse = await savedObjectsClient.find<ExceptionListSoSchema>({
    filter: `(exception-list.attributes.list_type: item AND exception-list.attributes.entries.list.id:${valueListId}) OR (exception-list-agnostic.attributes.list_type: item AND exception-list-agnostic.attributes.entries.list.id:${valueListId}) `,
    page,
    perPage,
    sortField,
    sortOrder,
    type: [exceptionListSavedObjectType, exceptionListAgnosticSavedObjectType],
  });
  return transformSavedObjectsToFoundExceptionListItem({
    savedObjectsFindResponse,
  });
};
