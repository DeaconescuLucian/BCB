import React, { useState, useEffect } from 'react';
import Input from '../../../components/FormControls/Input';
import Button from '../../../components/FormControls/Button';
import { CustomEvents } from '../../../../ts/events.ts';
import { useToast } from '../../../contexts/ToastContext.tsx';
import Loading from '../../../components/Loading/index.tsx';
import Empty from '../../../components/Empty/index.tsx';
import Dialog from '../../../components/Dialog/index.tsx';

function ConnectionSettings() {
  const [connections, setConnections] = useState([]);
  const [newConnection, setNewConnection] = useState('');
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [clearFlag, setClearFlag] = useState(false);

  const onConnectionInputChange = (value) => {
    setNewConnection(value || '');
  };

  const validateConnection = (value) => {
    return value.trim() === '' ? 'Connection string cannot be empty' : null;
  };

  const createConnection = async () => {
    setLoading(true);
    const result = await window.electron.invoke(CustomEvents.createConnectionEvent, newConnection);
    if (result) {
      setLoading(false);
      if (result.data.message) {
        showToast(result.data.message, 'success');
        setClearFlag(true);
        setNewConnection('');
      } else {
        if (result.data.error) {
          showToast(result.data.error, 'fail');
        }
      }
      fetchConnections();
    }
  };

  const updateActiveConnection = async (c) => {
    setLoading(true);
    const result = await window.electron.invoke(CustomEvents.updateActiveConnectionEvent, c.connection);
    if (result) {
      setLoading(false);
      if (result.success) {
        fetchConnections();
        showToast('Connection updated successfully', 'success');
      } else {
        showToast(result.error, 'fail');
      }
    }
  };

  const deleteConnection = async (c) => {
    setLoading(true);
    const result = await window.electron.invoke(CustomEvents.deleteConnectionEvent, c.connection);
    if (result) {
      setLoading(false);
      if (result.data.message) {
        showToast(result.data.message, 'success');
      } else {
        if (result.data.error) {
          showToast(result.data.error, 'fail');
        }
      }
      fetchConnections();
    }
  };

  const deleteActiveConnection = async (c) => {
    setLoading(true);
    const result = await window.electron.invoke(CustomEvents.updateActiveConnectionEvent, 'mainnet-beta');
    if (result) {
      if (result.success) {
        const result1 = await window.electron.invoke(CustomEvents.deleteConnectionEvent, c);
        if (result1) {
          setLoading(false);
          if (result1.data.message) {
            showToast(result1.data.message, 'success');
          } else {
            if (result1.data.error) {
              showToast(result1.data.error, 'fail');
            }
          }
          fetchConnections();
          return;
        }
      } else {
        showToast(result.error, 'fail');
      }
      fetchConnections();
    }
  };

  const fetchConnections = async () => {
    const result = await window.electron.invoke(CustomEvents.getConnectionsEvent);
    if (result && result.success) {
      console.log(result.data);
      setConnections(result.data);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  return (
    <div className="connection-settings-page">
      <div className="new-connection">
        <div className="header">
          <h3>New Connection</h3>
          <span>Create a new solana connection</span>
        </div>
        <div className="content">
          <Input
            type="text"
            theme="primary"
            validate={validateConnection}
            onChange={onConnectionInputChange}
            placeholder="Enter you connection string"
            clearFlag={clearFlag}
          ></Input>
          <Button
            onClick={() => {
              setClearFlag(false);
              createConnection();
            }}
            theme="secondary"
            type="add"
            text="Create"
            disabled={!newConnection.length > 0}
          ></Button>
        </div>
      </div>
      <div className="your-connections">
        <div className="header">
          <h3>Your Connections</h3>
          <span>Only 1 connection can be active</span>
        </div>
        <div className="content">
          {connections.length ? (
            <>
              <div className="connection-item">
                <div className="connection-item-title status-active">Active connection</div>
                <div className="connection">
                  <Input
                    type="text"
                    theme="primary"
                    readonly={true}
                    readOnlyValue={connections.find((c) => c.isActive)?.connection || 'mainnet-beta'}
                  ></Input>
                  {connections.find((c) => c.isActive) && connections.find((c) => c.isActive).connection !== 'mainnet-beta' && (
                    <div className="two-buttons">
                      <Button
                        onClick={() => {
                          setShowDialog(true);
                        }}
                        theme="error"
                        type="delete"
                        text="Delete"
                      ></Button>
                    </div>
                  )}
                </div>
              </div>
              <div className="connection-item">
                <div className="connection-item-title status-inactive">Inactive connections</div>
                {connections
                  .filter((c) => !c.isActive && c.connection !== 'mainnet-beta')
                  .map((c) => (
                    <div className="connection">
                      <Input type="text" theme="primary" readonly={true} readOnlyValue={c.connection}></Input>
                      <div className="two-buttons">
                        <Button
                          onClick={() => {
                            deleteConnection(c);
                          }}
                          theme="error"
                          type="delete"
                          text="Delete"
                        ></Button>
                        <Button
                          onClick={() => {
                            updateActiveConnection(c);
                          }}
                          theme="secondary"
                          type="power"
                          text="Activate"
                        ></Button>
                      </div>
                    </div>
                  ))}
              </div>
            </>
          ) : (
            <Empty text="You haven't added any connections."></Empty>
          )}

          <div className="connection-item">
            <div className="connection-item-title status-default">Default connection</div>
            <Input type="text" theme="primary" readonly={true} readOnlyValue={'mainnet-beta'}></Input>
          </div>
        </div>
      </div>
      {loading && <Loading></Loading>}
      {showDialog && (
        <Dialog className="delete-active-connection-dialog">
          <div className="header">
            <h2>This connection is active. Are you sure you want to delete it?</h2>
            <span>Deleting the active connection will automatically set "mainnet-beta" as your active connection.</span>
          </div>
          <div className="two-buttons">
            <Button
              onClick={() => {
                deleteActiveConnection(connections.find((c) => c.isActive).connection);
                setShowDialog(false);
              }}
              theme="error"
              type="delete"
              text="Delete"
            ></Button>
            <Button
              onClick={() => {
                setShowDialog(false);
              }}
              theme="secondary"
              type="cancel"
              text="Cancel"
            ></Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}

export default ConnectionSettings;
