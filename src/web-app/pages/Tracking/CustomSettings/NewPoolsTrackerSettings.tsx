import React, { useState, useEffect } from 'react';
import Dropdown from '../../../components/FormControls/Dropdown';
import { addSvg, crossSvg } from '../../../assets/svg';
import Dialog from '../../../components/Dialog';
import Input from '../../../components/FormControls/Input';
import Checkbox from '../../../components/FormControls/Checkbox';
import Button from '../../../components/FormControls/Button';
import Tabstrip from '../../../components/Tabstrip';
import Slider from '../../../components/Slider';

type FilterType = 'boolean' | 'number';
interface INewPoolTrackFilter {
  label: string;
  type: FilterType;
  value?: any;
}

interface INewPoolsTrackingSettings {
  filters?: {
    label: string;
    type: FilterType;
    value?: any;
  }[];
  onChange: Function;
}

function NewPoolsTrackingSettings(props: INewPoolsTrackingSettings) {
  const FILTERS = [
    {
      label: 'MINIMUM_SOLANA_POOL',
      type: 'number',
      value: null,
    },
    {
      label: 'MAXIMUM_SOLANA_POOL',
      type: 'number',
      value: null,
    },
    {
      label: 'MINIMUM_POOL_PERCENTAGE',
      type: 'number',
      value: null,
    },
    {
      label: 'MINIMUM_POTATO_COUNT',
      type: 'number',
      value: null,
    },
    {
      label: 'NOT_MINTABLE',
      type: 'boolean',
      value: null,
    },
    {
      label: 'NOT_FREEZABLE',
      type: 'boolean',
      value: null,
    },
  ] as INewPoolTrackFilter[];
  const [addedFilters, setAddedFilters] = useState(props.filters || []);
  const [showAddFilterDialog, setShowAddFilterDialog] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(
    FILTERS.filter((e) => !addedFilters.find((f) => f.label === e.label)).map((e) => {
      return {
        ...e,
        type: e.type as FilterType,
        value: e.value as unknown,
      };
    })[0]
  );
  const [dropdownOptions, setDropdownOptions] = useState(FILTERS);
  const [buyAmountTabs] = useState([
    { name: 'Fixed', url: '/track' },
    { name: 'Dynamic', url: '/track' },
    { name: 'Algorithmic', url: '/track' },
  ]);
  const [buyAmountTab, setBuyAmountTab] = useState({ name: 'Fixed', url: '/track' });
  const [buyAmount, setBuyAmount] = useState((null as unknown) as number);
  const [budget, setBudget] = useState((null as unknown) as number);
  const [buyAmountError, setBuyAmountError] = useState((null as unknown) as string);
  const [budgetError, setBudgetError] = useState((null as unknown) as string);
  const [trackDuration, setTrackDuration] = useState(500);
  const [trackDurationError, setTrackDurationError] = useState((null as unknown) as string);

  useEffect(() => {
    setDropdownOptions(FILTERS.filter((e) => !addedFilters.find((f) => f.label === e.label)));
    setSelectedFilter(
      FILTERS.filter((e) => !addedFilters.find((f) => f.label === e.label)).map((e) => {
        return {
          ...e,
          type: e.type as FilterType,
          value: e.value as unknown,
        };
      })[0]
    );
  }, [addedFilters]);

  const validateBuyAmount = (value) => {
    if (!value) {
      setBuyAmountError('Please select a buy amount');
      return 'Please select a buy amount';
    }
    setBuyAmountError((null as unknown) as string);
    return null;
  };

  const validateBudget = (value) => {
    if (!value) {
      setBudgetError('Please select a budget');
      return 'Please select a budget';
    }
    setBudgetError((null as unknown) as string);
    return null;
  };

  const validateTrackDuration = (value) => {
    if (!value) {
      setTrackDurationError('Please select a track duration');
      return 'Please select a track duration';
    }
    setTrackDurationError((null as unknown) as string);
    return null;
  };

  const createProcess = () => {
    
  }

  return (
    <>
      <div className="filter-panel">
        <div className="title">
          <span>Filters</span>
          <span>
            {addedFilters.length > 0 && (
              <span
                className="clear-button"
                onClick={() => {
                  setAddedFilters([]);
                }}
              >
                {crossSvg} Clear
              </span>
            )}
            {dropdownOptions.length > 0 && (
              <>
                <span
                  className="add-all-button"
                  onClick={() => {
                    setDropdownOptions([]);
                    setAddedFilters((prev) => [...prev, ...dropdownOptions]);
                  }}
                >
                  {addSvg} Add All
                </span>
                <span
                  className="add-button"
                  onClick={() => {
                    setShowAddFilterDialog(true);
                  }}
                >
                  {addSvg} Add
                </span>
              </>
            )}
          </span>
        </div>
        <div className="filter-panel-content">
          {addedFilters.length === 0 ? (
            <span>No Filters</span>
          ) : (
            <>
              {addedFilters.map((f, index) => {
                return (
                  <div className="filter-row" key={`filter-row-${index}`}>
                    <span>{f.label}</span>
                    {f.type === 'number' ? (
                      <div className="value-container">
                        <Input
                          type="number"
                          onChange={(val) => {
                            const newFilters = [...addedFilters];
                            newFilters[index].value = val;
                            setAddedFilters(newFilters);
                          }}
                          value={f.value}
                        ></Input>
                        <span
                          onClick={() => {
                            const newFilters = [...addedFilters.filter((e) => e.label !== f.label)];
                            setAddedFilters(newFilters);
                          }}
                        >
                          {crossSvg}
                        </span>
                      </div>
                    ) : (
                      <div className="value-container">
                        <Checkbox
                          onChange={(val) => {
                            const newFilters = [...addedFilters];
                            newFilters[index].value = val;
                            setAddedFilters(newFilters);
                          }}
                          value={f.value}
                        ></Checkbox>
                        <span
                          onClick={() => {
                            const newFilters = [...addedFilters.filter((e) => e.label !== f.label)];
                            setAddedFilters(newFilters);
                          }}
                        >
                          {crossSvg}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
        <div className="buy-amount-panel">
          <div className="title">
            <span>Buy amount *</span>
            <Tabstrip
              tabs={buyAmountTabs}
              activeTab={buyAmountTab}
              onChange={(tab) => {
                setBuyAmountTab(tab);
              }}
            ></Tabstrip>
          </div>
          <div className="buy-amount-panel-content">
            {buyAmountTab.name === 'Fixed' && (
              <>
                <div className="buy-amount-input-container">
                  <span>Amount</span>
                  <Input
                    type="number"
                    onChange={(val) => {
                      setBuyAmount(val);
                    }}
                    validate={validateBuyAmount}
                    value={buyAmount}
                  ></Input>
                </div>
                {buyAmountError && <span className="error-message">{buyAmountError}</span>}
              </>
            )}
            {buyAmountTab.name === 'Dynamic' && (
              <div className="buy-amount-input-container">
                <Slider
                  onChange={(val) => {
                    setBuyAmount(val);
                  }}
                  min={0}
                  max={100}
                  noInput={true}
                  step={'0.1'}
                  theme="primary"
                  value={buyAmount}
                  label={
                    <span>
                      Amount (<span className="val"> {buyAmount} % </span>)
                    </span>
                  }
                ></Slider>
              </div>
            )}
            {buyAmountTab.name === 'Algorithmic' && <span>Comming soon</span>}
          </div>
        </div>

        <div className="buy-amount-panel">
          <div className="title">
            <span>Budget *</span>
          </div>
          <div className="buy-amount-panel-content">
            <>
              <div className="buy-amount-input-container">
                <span>Amount</span>
                <Input
                  type="number"
                  onChange={(val) => {
                    setBudget(val);
                  }}
                  validate={validateBudget}
                  value={budget}
                ></Input>
              </div>
              {budgetError && <span className="error-message">{budgetError}</span>}
            </>
          </div>
        </div>

        <div className="buy-amount-panel">
          <div className="title">
            <span>Track duration *</span>
          </div>
          <div className="buy-amount-panel-content">
            <>
              <div className="track-duration-input-container">
                <span>Duration</span>
                <Input
                  type="number"
                  onChange={(val) => {
                    setTrackDuration(val);
                  }}
                  validate={validateTrackDuration}
                  value={trackDuration}
                ></Input>
              </div>
              {trackDurationError && <span className="error-message">{trackDurationError}</span>}
            </>
          </div>
        </div>

        <Button
          onClick={() => createProcess()}
          type="add"
          theme="primary"
          text="Create"
          disabled={!buyAmount || !budget || !trackDuration}
          tooltipDisabled="Make sure to set values for all of the required parameters"
        ></Button>
      </div>
      {showAddFilterDialog && (
        <Dialog onClose={() => setShowAddFilterDialog(false)} className="add-filter-dialog">
          <>
            <div className="add-filter-dialog-header">
              <div className="title">
                {' '}
                <span>Add Filter</span>
                <span
                  onClick={() => {
                    setShowAddFilterDialog(false);
                  }}
                >
                  {crossSvg}
                </span>
              </div>
            </div>
            <div className="add-filter-dialog-content">
              <div className="setting-label">Filter</div>
              <Dropdown
                onChange={(opt) => {
                  setSelectedFilter(opt);
                }}
                options={dropdownOptions}
              />
              <div className="setting-label">Value</div>
              {selectedFilter.type === 'number' ? (
                <Input
                  type="number"
                  onChange={(val) => {
                    setSelectedFilter((prev) => {
                      return { ...prev, value: val };
                    });
                  }}
                  value={selectedFilter.value}
                ></Input>
              ) : (
                <Checkbox
                  onChange={(val) => {
                    setSelectedFilter((prev) => {
                      return { ...prev, value: val };
                    });
                  }}
                  value={!!selectedFilter.value}
                ></Checkbox>
              )}
              <Button
                onClick={() => {
                  setAddedFilters((prev) => [...prev, selectedFilter]);
                  setShowAddFilterDialog(false);
                }}
                type="add"
                theme="primary"
                text="Add filter"
              ></Button>
            </div>
          </>
        </Dialog>
      )}
    </>
  );
}

export default NewPoolsTrackingSettings;
