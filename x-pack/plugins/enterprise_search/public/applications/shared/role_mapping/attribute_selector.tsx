/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';

import {
  EuiComboBox,
  EuiComboBoxOptionOption,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiPanel,
  EuiSelect,
  EuiSpacer,
  EuiTitle,
} from '@elastic/eui';

import {
  ANY_AUTH_PROVIDER,
  ANY_AUTH_PROVIDER_OPTION_LABEL,
  AUTH_ANY_PROVIDER_LABEL,
  AUTH_INDIVIDUAL_PROVIDER_LABEL,
  ATTRIBUTE_SELECTOR_TITLE,
  AUTH_PROVIDER_LABEL,
  EXTERNAL_ATTRIBUTE_LABEL,
  ATTRIBUTE_VALUE_LABEL,
} from './constants';

export type AttributeName = keyof AttributeExamples | 'role';

interface Props {
  attributeName: AttributeName;
  attributeValue?: string;
  attributes: string[];
  selectedAuthProviders?: string[];
  availableAuthProviders?: string[];
  elasticsearchRoles: string[];
  disabled: boolean;
  multipleAuthProvidersConfig: boolean;
  handleAttributeSelectorChange(value: string, elasticsearchRole: string): void;
  handleAttributeValueChange(value: string): void;
  handleAuthProviderChange?(value: string[]): void;
}

interface AttributeExamples {
  username: string;
  email: string;
  metadata: string;
}

interface ParentOption extends EuiComboBoxOptionOption<string> {
  label: string;
  options: ChildOption[];
}

interface ChildOption extends EuiComboBoxOptionOption<string> {
  value: string;
  label: string;
}

const attributeValueExamples: AttributeExamples = {
  username: 'elastic,*_system',
  email: 'user@example.com,*@example.org',
  metadata: '{"_reserved": true}',
};

const getAuthProviderOptions = (availableAuthProviders: string[]) => {
  return [
    {
      label: AUTH_ANY_PROVIDER_LABEL,
      options: [{ value: ANY_AUTH_PROVIDER, label: ANY_AUTH_PROVIDER_OPTION_LABEL }],
    },
    {
      label: AUTH_INDIVIDUAL_PROVIDER_LABEL,
      options: availableAuthProviders.map((authProvider) => ({
        value: authProvider,
        label: authProvider,
      })),
    },
  ];
};

const getSelectedOptions = (selectedAuthProviders: string[], availableAuthProviders: string[]) => {
  const groupedOptions: ParentOption[] = getAuthProviderOptions(availableAuthProviders);
  const childOptions: ChildOption[] = [];
  const options = groupedOptions.reduce((acc, n) => [...acc, ...n.options], childOptions);
  return options.filter((o) => o.value && selectedAuthProviders.includes(o.value));
};

export const AttributeSelector: React.FC<Props> = ({
  attributeName,
  attributeValue = '',
  attributes,
  availableAuthProviders,
  selectedAuthProviders = [ANY_AUTH_PROVIDER],
  elasticsearchRoles,
  disabled,
  multipleAuthProvidersConfig,
  handleAttributeSelectorChange,
  handleAttributeValueChange,
  handleAuthProviderChange = () => null,
}) => {
  return (
    <EuiPanel
      data-test-subj="AttributeSelector"
      paddingSize="l"
      className={disabled ? 'euiPanel--disabled' : ''}
    >
      <EuiTitle size="s">
        <h3>{ATTRIBUTE_SELECTOR_TITLE}</h3>
      </EuiTitle>
      <EuiSpacer />
      {availableAuthProviders && multipleAuthProvidersConfig && (
        <EuiFlexGroup alignItems="stretch">
          <EuiFlexItem>
            <EuiFormRow label={AUTH_PROVIDER_LABEL} fullWidth>
              <EuiComboBox
                data-test-subj="AuthProviderSelect"
                selectedOptions={getSelectedOptions(selectedAuthProviders, availableAuthProviders)}
                options={getAuthProviderOptions(availableAuthProviders)}
                onChange={(options) => {
                  handleAuthProviderChange(options.map((o) => (o as ChildOption).value));
                }}
                fullWidth
                isDisabled={disabled}
              />
            </EuiFormRow>
          </EuiFlexItem>
          <EuiFlexItem />
        </EuiFlexGroup>
      )}
      <EuiFlexGroup alignItems="stretch">
        <EuiFlexItem>
          <EuiFormRow label={EXTERNAL_ATTRIBUTE_LABEL} fullWidth>
            <EuiSelect
              name="external-attribute"
              data-test-subj="ExternalAttributeSelect"
              value={attributeName}
              required
              options={attributes.map((attribute) => ({ value: attribute, text: attribute }))}
              onChange={(e) => {
                handleAttributeSelectorChange(e.target.value, elasticsearchRoles[0]);
              }}
              fullWidth
              disabled={disabled}
            />
          </EuiFormRow>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiFormRow label={ATTRIBUTE_VALUE_LABEL} fullWidth>
            {attributeName === 'role' ? (
              <EuiSelect
                value={attributeValue}
                name="elasticsearch-role"
                data-test-subj="ElasticsearchRoleSelect"
                required
                options={elasticsearchRoles.map((elasticsearchRole) => ({
                  value: elasticsearchRole,
                  text: elasticsearchRole,
                }))}
                onChange={(e) => {
                  handleAttributeValueChange(e.target.value);
                }}
                fullWidth
                disabled={disabled}
              />
            ) : (
              <EuiFieldText
                value={attributeValue}
                name="attribute-value"
                placeholder={attributeValueExamples[attributeName]}
                onChange={(e) => {
                  handleAttributeValueChange(e.target.value);
                }}
                fullWidth
                disabled={disabled}
              />
            )}
          </EuiFormRow>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );
};
