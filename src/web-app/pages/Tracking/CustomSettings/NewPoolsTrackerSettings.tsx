import React, { useState, useEffect, useRef } from 'react';
import Dropdown from '../../../components/FormControls/Dropdown';
import { addSvg, crossSvg } from '../../../assets/svg';
import Dialog from '../../../components/Dialog';
import Input from '../../../components/FormControls/Input';
import Checkbox from '../../../components/FormControls/Checkbox';
import Button from '../../../components/FormControls/Button';
import Tabstrip from '../../../components/Tabstrip';
import Slider from '../../../components/Slider';
import { useSelector } from 'react-redux';
import { CustomEvents } from '../../../../ts/events';
import { useToast } from '../../../contexts/ToastContext';
import Loading from '../../../components/Loading';

type FilterType = 'bool' | 'number';
interface INewPoolTrackFilter {
  label: string;
  type: FilterType;
  value?: any;
}

interface INewPoolsTrackingSettings {
  filters?: {
    id: number;
    label: string;
    type: FilterType;
    value?: any;
  }[];
  onChange: Function;
}

function NewPoolsTrackingSettings(props: INewPoolsTrackingSettings) {
  const { poolFilters } = useSelector((state: any) => state.poolFilters);
  const { selectedWalletDetails } = useSelector(
    (state: any) => state.wallets
  );
  const FILTERS = poolFilters.map((f) => {
    return {
      id: f.id,
      label: f.name,
      type: f.filterType,
      value: null,
    } as INewPoolTrackFilter;
  });
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
  const [minBuyAmount, setMinBuyAmount] = useState((null as unknown) as number);
  const [budget, setBudget] = useState((null as unknown) as number);
  const [buyAmountError, setBuyAmountError] = useState((null as unknown) as string);
  const [minBuyAmountError, setMinBuyAmountError] = useState((null as unknown) as string);
  const [budgetError, setBudgetError] = useState((null as unknown) as string);
  const [trackDuration, setTrackDuration] = useState(500);
  const [trackDurationError, setTrackDurationError] = useState((null as unknown) as string);
  const [targetPercentage, setTargetPercentage] = useState(200);
  const [targetPercentageError, setTargetPercentageError] = useState((null as unknown) as string);
  const [stopLossPercentage, setStopLossPercentage] = useState(50);
  const [stopLossPercentageError, setStopLossPercentageError] = useState((null as unknown) as string);
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(null);

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

  const validateMinBuyAmount = (value) => {
    if (!value) {
      setMinBuyAmountError('Please select a minimum buy amount');
      return 'Please select a minimum buy amount';
    }
    setMinBuyAmountError((null as unknown) as string);
    return null;
  };

  const validateBudget = (value) => {
    if (!value) {
      setBudgetError('Please select a budget');
      return 'Please select a budget';
    }

    if(value > selectedWalletDetails.balance)
    {
      setBudgetError(`Insuficient balance in wallet ${selectedWalletDetails.alias}`);
      return `Insuficient balance in wallet ${selectedWalletDetails.alias}`;
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

  const validateTargetPercentage = (value) => {
    if (!value) {
      setTargetPercentageError('Please select a target percentage');
      return 'Please select a target percentage';
    }
    setTargetPercentageError((null as unknown) as string);
    return null;
  };

  const validateStopLossPercentage = (value) => {
    if (!value) {
      setStopLossPercentageError('Please select a stop loss percentage');
      return 'Please select a stop loss percentage';
    }
    setStopLossPercentageError((null as unknown) as string);
    return null;
  };

  const createProcess = async () => {
    setLoading(true);
    const result = await window.electron.invoke(CustomEvents.createTrackProcessEvent, {
      parentWallet: selectedWalletDetails.publicKey,
      budget: budget,
      trackProcessTypeId: 0,
      createdOn: new Date().toISOString(),
      poolFilters: addedFilters,
      settings: [
        { value: budget, id: 0 },
        { value: buyAmountTab.name, id: 1 },
        { value: buyAmount, id: 2 },
        { value: minBuyAmount, id: 3 },
        { value: trackDuration, id: 4 },
        { value: targetPercentage, id: 5 },
        { value: stopLossPercentage, id: 6 },
      ],
    });
    if (result) {
      if(result.success)
      {
        showToast('NPT Process created successfully', 'success');
        setLoading(false);
      }
      else {
        showToast('There was an error creating the process', 'fail');
        setLoading(false);
      }

    }
  };

  return (
    <>
      <div className="filter-panel" ref={loadingRef}>
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
              <>
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
                <div className="buy-amount-input-container min-buy-amount">
                  <span>Min amount</span>
                  <Input
                    type="number"
                    onChange={(val) => {
                      setMinBuyAmount(val);
                    }}
                    validate={validateMinBuyAmount}
                    value={minBuyAmount}
                  ></Input>
                </div>
                {minBuyAmountError && <span className="error-message">{minBuyAmountError}</span>}
              </>
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

        <div className="buy-amount-panel">
          <div className="title">
            <span>Target percentage *</span>
          </div>
          <div className="buy-amount-panel-content">
            <>
              <div className="percentage-input-container">
                <span>Percentage</span>
                <Input
                  type="number"
                  onChange={(val) => {
                    setTargetPercentage(val);
                  }}
                  validate={validateTargetPercentage}
                  value={targetPercentage}
                ></Input>
              </div>
              {targetPercentageError && <span className="error-message">{targetPercentageError}</span>}
            </>
          </div>
        </div>

        <div className="buy-amount-panel">
          <div className="title">
            <span>Stop loss percentage *</span>
          </div>
          <div className="buy-amount-panel-content">
            <>
              <div className="percentage-input-container">
                <span>Percentage</span>
                <Input
                  type="number"
                  onChange={(val) => {
                    setStopLossPercentage(val);
                  }}
                  validate={validateStopLossPercentage}
                  value={stopLossPercentage}
                ></Input>
              </div>
              {stopLossPercentageError && <span className="error-message">{stopLossPercentageError}</span>}
            </>
          </div>
        </div>

        <Button
          onClick={() => createProcess()}
          type="add"
          theme="primary"
          text="Create"
          disabled={!buyAmount || !budget || !trackDuration || loading}
          tooltipDisabled={loading ? "Creating process" : "Make sure to set values for all of the required parameters"}
        ></Button>
      </div>
      {loading && <Loading parentRef={loadingRef} text="Creating proces..."></Loading>}
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
