import { useState, useEffect, useRef } from 'react';
import './App.css';

const sections = [
  { key: 'settings', label: 'Settings' },
  { key: 'transactions', label: 'Transaction History' },
  { key: 'apiTest', label: 'Payment API Test' },
  { key: 'swapTest', label: 'Swap API Test' },
  { key: 'payoutTest', label: 'Payout API Test' },
];

// Define API base URL from env, fallback to localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

function TransactionsTable() {
  const [transactions, setTransactions] = useState([]);
  const [statistics, setStatistics] = useState({ allTime: 0, thisMonth: 0, thisWeek: 0, today: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const url = showAll
      ? `${API_BASE_URL}/transactions?include_old=true`
      : `${API_BASE_URL}/transactions`;
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch transactions');
        return res.json();
      })
      .then(data => {
        setTransactions(data.transactions || []);
        setStatistics(data.statistics || { allTime: 0, thisMonth: 0, thisWeek: 0, today: 0 });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [showAll]);

  const handleSort = (col) => {
    if (sortBy === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortDir('asc');
    }
  };

  // Filtering and searching
  let filtered = transactions.filter((tx) => {
    const searchStr = search.toLowerCase();
    const matchesSearch =
      !searchStr ||
      Object.values(tx).some((v) =>
        typeof v === 'string' && v.toLowerCase().includes(searchStr)
      );
    const matchesStatus = !statusFilter || tx.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Sorting
  filtered = filtered.sort((a, b) => {
    let av = a[sortBy];
    let bv = b[sortBy];
    if (av === null) return 1;
    if (bv === null) return -1;
    if (typeof av === 'string' && typeof bv === 'string') {
      if (sortDir === 'asc') return av.localeCompare(bv);
      return bv.localeCompare(av);
    }
    if (typeof av === 'number' && typeof bv === 'number') {
      return sortDir === 'asc' ? av - bv : bv - av;
    }
    return 0;
  });

  const statusOptions = Array.from(new Set(transactions.map((tx) => tx.status))).filter(Boolean);

  if (loading) return <div>Loading transactions...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;
  if (!transactions.length && !statistics.allTime) return <div>No transactions found.</div>;

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <button onClick={() => setShowAll(v => !v)} style={{ marginRight: 12 }}>
          {showAll ? 'Show Only Recent/Active' : 'Show All Transactions'}
        </button>
      </div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 24, fontSize: '1.05em' }}>
        <div><b>Total:</b> {statistics.allTime}</div>
        <div><b>This Month:</b> {statistics.thisMonth}</div>
        <div><b>This Week:</b> {statistics.thisWeek}</div>
        <div><b>Today:</b> {statistics.today}</div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Search (ID, user, invoice, etc)"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginRight: 8 }}
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95em' }}>
        <thead>
          <tr>
            {['id','amount','status','fee','createdAt','completedAt','updatedAt','userId','addressesUsed','apiKeyId','clientUserId','invoiceId','txHashes'].map((col) => (
              <th
                key={col}
                style={{ border: '1px solid #ccc', padding: '4px', cursor: 'pointer' }}
                onClick={() => handleSort(col)}
              >
                {col} {sortBy === col ? (sortDir === 'asc' ? '▲' : '▼') : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((tx) => (
            <tr key={tx.id}>
              <td style={{ border: '1px solid #ccc', padding: '4px' }}>{tx.id}</td>
              <td style={{ border: '1px solid #ccc', padding: '4px' }}>{tx.amount}</td>
              <td style={{ border: '1px solid #ccc', padding: '4px' }}>{tx.status}</td>
              <td style={{ border: '1px solid #ccc', padding: '4px' }}>{tx.fee}</td>
              <td style={{ border: '1px solid #ccc', padding: '4px' }}>{tx.createdAt}</td>
              <td style={{ border: '1px solid #ccc', padding: '4px' }}>{tx.completedAt || <i>None</i>}</td>
              <td style={{ border: '1px solid #ccc', padding: '4px' }}>{tx.updatedAt}</td>
              <td style={{ border: '1px solid #ccc', padding: '4px' }}>{tx.userId}</td>
              <td style={{ border: '1px solid #ccc', padding: '4px', maxWidth: 120, overflow: 'auto' }}>{Array.isArray(tx.addressesUsed) ? tx.addressesUsed.join(', ') : ''}</td>
              <td style={{ border: '1px solid #ccc', padding: '4px' }}>{tx.apiKeyId}</td>
              <td style={{ border: '1px solid #ccc', padding: '4px' }}>{tx.clientUserId}</td>
              <td style={{ border: '1px solid #ccc', padding: '4px' }}>{tx.invoiceId}</td>
              <td style={{ border: '1px solid #ccc', padding: '4px', maxWidth: 120, overflow: 'auto' }}>{Array.isArray(tx.txHashes) ? tx.txHashes.join(', ') : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 8, fontSize: '0.9em', color: '#666' }}>
        Showing {filtered.length} of {transactions.length} transactions
      </div>
    </div>
  );
}

function UserConfigDetails({ userConfig, setUserConfig, loading, error }) {
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const apiKey = userConfig?.apiKey || import.meta.env.VITE_API_KEY;

  useEffect(() => {
    if (userConfig) {
      setForm({
        zcashAddress: userConfig.zcashAddress || '',
        webhookUrl: userConfig.webhookUrl || '',
        webhookSecret: userConfig.webhookSecret || '',
        transactionFee: userConfig.transactionFee || '',
        licenseKeyDetails: userConfig.licenseKeyDetails || '',
      });
    }
  }, [userConfig]);

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    if (!setUserConfig) return;
    try {
      const res = await fetch(`${API_BASE_URL}/user-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey, ...form }),
      });
      if (!res.ok) throw new Error('Failed to update config');
      const updated = await res.json();
      setUserConfig(updated);
      setEditMode(false);
    } catch (err) {
      // Optionally handle error
    }
  };

  if (loading) return <div>Loading user config...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;
  if (!userConfig) return <div>No user config found.</div>;

  return (
    <div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
        <tbody>
          <tr><td style={{ fontWeight: 'bold' }}>User ID</td><td>{userConfig.dbUserId}</td></tr>
          {userConfig.apiKey && (
            <tr><td style={{ fontWeight: 'bold' }}>API Key</td><td><code>{userConfig.apiKey}</code></td></tr>
          )}
          {/* License Key Details */}
          {!editMode && (
            <tr>
              <td style={{ fontWeight: 'bold' }}>License Key</td>
              <td>
                {userConfig.licenseKeyDetails === undefined
                  ? <span style={{ color: '#888' }}>Not available</span>
                  : userConfig.licenseKeyDetails === null
                    ? <i>None</i>
                    : <div>
                        <div><b>Key:</b> <code>{userConfig.licenseKeyDetails.accessToken.slice(0, 10)}...</code></div>
                        <div><b>Expires At:</b> {(userConfig.licenseKeyDetails.expiresAt).toLocaleString()}</div>
                      </div>
                }
              </td>
            </tr>
          )}
          {/* Real Usage Rows */}
          {!editMode && userConfig.totalUsage !== undefined && (
            <tr>
              <td style={{ fontWeight: 'bold' }}>Total Usage</td>
              <td>{userConfig.totalUsage}</td>
            </tr>
          )}
          {!editMode && userConfig.monthlyUsage !== undefined && (
            <tr>
              <td style={{ fontWeight: 'bold' }}>Monthly Usage</td>
              <td>{userConfig.monthlyUsage}</td>
            </tr>
          )}
          {/* <tr><td style={{ fontWeight: 'bold' }}>API Key ID</td><td>{config.apiKeyId}</td></tr> */}
          <tr>
            <td style={{ fontWeight: 'bold' }}>Zcash Address</td>
            <td>
              {editMode ? (
                <input name="zcashAddress" value={form.zcashAddress} onChange={handleChange} />
              ) : userConfig.zcashAddress}
            </td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold' }}>Webhook URL (this is an endpoint on the site that initiates the transaction)</td>
            <td>
              {editMode ? (
                <input name="webhookUrl" value={form.webhookUrl} onChange={handleChange} />
              ) : (userConfig.webhookUrl || <i>None</i>)}
            </td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold' }}>Webhook Secret(this is a secret key that is used to verify the webhook request)</td>
            <td>
              {editMode ? (
                <input name="webhookSecret" value={form.webhookSecret} onChange={handleChange} />
              ) : (userConfig.webhookSecret || <i>None</i>)}
            </td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold' }}>Transaction Fee (%)</td>
            <td>
              {editMode ? (
                <input name="transactionFee" value={form.transactionFee} onChange={handleChange} type="number" min="0" max="100" step="0.01" />
              ) : userConfig.transactionFee}
            </td>
          </tr>
        </tbody>
      </table>
      {editMode ? (
        <div>
          <button onClick={handleSave} style={{ marginRight: 8 }}>Save</button>
          <button onClick={() => { setEditMode(false); setForm({
            zcashAddress: userConfig.zcashAddress || '',
            webhookUrl: userConfig.webhookUrl || '',
            webhookSecret: userConfig.webhookSecret || '',
            transactionFee: userConfig.transactionFee || '',
          }); }}>Cancel</button>
        </div>
      ) : (
        <button onClick={() => setEditMode(true)}>Edit</button>
      )}
    </div>
  );
}

function ApiTestSection({ userConfig }) {
  const [url, setUrl] = useState(`${API_BASE_URL}/create`);
  const [method, setMethod] = useState('POST');
  const [body, setBody] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [accessToken, setAccessToken] = useState(''); // License key
  const [licenseLoading, setLicenseLoading] = useState(false);
  const [licenseError, setLicenseError] = useState(null);

  // Fields for /create endpoint
  const [apiKey, setApiKey] = useState(userConfig?.apiKey || import.meta.env.VITE_API_KEY);
  const [userId, setUserId] = useState('');
  const [invoiceId, setInvoiceId] = useState('');
  const [amount, setAmount] = useState('');

  // Polling state for /address
  const [addressInfo, setAddressInfo] = useState(null);
  const [polling, setPolling] = useState(false);
  const pollingRef = useRef();

  // Detect if the URL is /create and method is POST
  const isCreate = url.endsWith('/create') && method === 'POST';

  // License activation handler
  const handleActivateLicense = async () => {
    setLicenseLoading(true);
    setLicenseError(null);
    setAccessToken('');
    try {
      const res = await fetch('https://z-vault.vercel.app/api/license/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          usage: userConfig?.totalUsage, // use userConfig
          calendarMonthUsage: userConfig?.monthlyUsage,
          instanceId: invoiceId,
          version: '1',
        }),
      });
      if (!res.ok) throw new Error('Failed to activate license');
      const data = await res.json();
      setAccessToken(data.accessToken || '');
    } catch (err) {
      setLicenseError(err.message);
    } finally {
      setLicenseLoading(false);
    }
  };

  // Auto-generate body for /create
  useEffect(() => {
    if (isCreate) {
      setBody(JSON.stringify({
        api_key: apiKey,
        user_id: userId,
        invoice_id: invoiceId,
        amount: amount,
        ...(accessToken ? { access_token: accessToken } : {})
      }, null, 2));
    }
  }, [apiKey, userId, invoiceId, amount, url, method, accessToken]);

  // Update apiKey if userConfig changes
  useEffect(() => {
    if (userConfig?.apiKey && !apiKey) setApiKey(userConfig.apiKey);
  }, [userConfig]);

  // Poll /address endpoint
  useEffect(() => {
    if (!polling) return;
    let stopped = false;
    async function poll() {
      try {
        const params = new URLSearchParams({ api_key: apiKey, user_id: userId, invoice_id: invoiceId });
        const res = await fetch(`${API_BASE_URL}/address?${params.toString()}`);
        const data = await res.json();
        setAddressInfo(data);
        if (data.address && data.address !== 'Not Available Yet') {
          setPolling(false);
          return;
        }
        if (data.not_found) {
          setPolling(false);
          return;
        }
        if (!stopped) pollingRef.current = setTimeout(poll, 2000);
      } catch (e) {
        setPolling(false);
      }
    }
    poll();
    return () => { stopped = true; clearTimeout(pollingRef.current); };
  }, [polling, apiKey, userId, invoiceId]);

  const handleSend = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    setAddressInfo(null);
    setPolling(false);
    try {
      const res = await fetch(url, {
        method,
        headers: method === 'POST' ? { 'Content-Type': 'application/json' } : undefined,
        body: method === 'POST' && body ? body : undefined,
      });
      const text = await res.text();
      setResponse(text);
      // If /create and 202, start polling /address
      if (isCreate && res.status === 202) {
        setPolling(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const [stressCount, setStressCount] = useState(10); // Number of requests for stress test
  const [stressResults, setStressResults] = useState([]);
  const [stressLoading, setStressLoading] = useState(false);

  // Stress test handler
  const handleStressTest = async () => {
    setStressLoading(true);
    setStressResults([]);
    let baseInvoice = invoiceId || 'stress-invoice-';
    const tasks = Array.from({ length: stressCount }).map((_, i) => (async () => {
      const thisInvoiceId = baseInvoice + (Date.now() + i);
      const reqBody = JSON.stringify({
        api_key: apiKey,
        user_id: userId,
        invoice_id: thisInvoiceId,
        amount: amount,
        ...(accessToken ? { access_token: accessToken } : {})
      });
      let createStatus, createBody, addressPoll = null, timeToAddress = null;
      const startTime = Date.now();
      try {
        const res = await fetch(`${API_BASE_URL}/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: reqBody,
        });
        createStatus = res.status;
        createBody = await res.text();
      } catch (err) {
        setStressResults(prev => [...prev, { i, status: 'error', body: err.message, requestBody: reqBody, addressPoll, timeToAddress: null }]);
        return;
      }
      // Poll /address endpoint for this invoice
      let pollResult = null;
      let pollTries = 0;
      const maxPolls = 10;
      while (pollTries < maxPolls) {
        pollTries++;
        try {
          const params = new URLSearchParams({ api_key: apiKey, user_id: userId, invoice_id: thisInvoiceId });
          const res = await fetch(`${API_BASE_URL}/address?${params.toString()}`);
          const data = await res.json();
          if (data.address && data.address !== 'Not Available Yet') {
            pollResult = { found: true, tries: pollTries, data };
            break;
          }
          if (data.not_found) {
            pollResult = { found: false, tries: pollTries, data };
            break;
          }
        } catch (e) {
          pollResult = { found: false, tries: pollTries, error: e.message };
          break;
        }
        await new Promise(r => setTimeout(r, 1200));
      }
      timeToAddress = Date.now() - startTime;
      setStressResults(prev => [...prev, {
        i,
        status: createStatus,
        body: createBody,
        requestBody: reqBody,
        addressPoll: pollResult,
        timeToAddress
      }]);
    })());
    await Promise.all(tasks);
    setStressLoading(false);
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <h2>Test Backend API</h2>
      <div style={{ marginBottom: 8 }}>
        <input style={{ width: '70%' }} value={url} onChange={e => setUrl(e.target.value)} placeholder="API URL" />
        <select value={method} onChange={e => setMethod(e.target.value)} style={{ marginLeft: 8 }}>
          <option value="GET">GET</option>
          <option value="POST">POST</option>
        </select>
      </div>
      {isCreate ? (
        <div style={{ marginBottom: 8, background: 'var(--card-bg)', padding: 12, borderRadius: 4 }}>
          <div style={{ marginBottom: 6 }}>
            <label>API Key: <input value={apiKey} onChange={e => setApiKey(e.target.value)} style={{ width: '80%' }} /></label>
          </div>
          <div style={{ marginBottom: 6 }}>
            <label>User ID: <input value={userId} onChange={e => setUserId(e.target.value)} style={{ width: '80%' }} /></label>
          </div>
          <div style={{ marginBottom: 6 }}>
            <label>Invoice ID: <input value={invoiceId} onChange={e => setInvoiceId(e.target.value)} style={{ width: '80%' }} /></label>
          </div>
          <div style={{ marginBottom: 6 }}>
            <label>Amount (GBP cents): <input value={amount} onChange={e => setAmount(e.target.value)} style={{ width: '80%' }} /></label>
          </div>
          <div style={{ marginBottom: 6 }}>
            <button onClick={handleActivateLicense} disabled={licenseLoading || !apiKey || !invoiceId}>
              {licenseLoading ? 'Activating License...' : 'Activate License'}
            </button>
            {accessToken && <span style={{ marginLeft: 8, color: 'green', fontSize: '0.9em' }}>License ready</span>}
            {licenseError && <span style={{ color: 'red', marginLeft: 8 }}>{licenseError}</span>}
          </div>
          {accessToken && (
            <div style={{ fontSize: '0.85em', color: '#888', wordBreak: 'break-all' }}>
              <b>Access Token:</b> {accessToken}
            </div>
          )}
        </div>
      ) : (
        method === 'POST' && (
          <textarea
            style={{ width: '100%', minHeight: 60, marginBottom: 8 }}
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Request body (JSON)"
          />
        )
      )}
      <button onClick={handleSend} disabled={loading} style={{ marginBottom: 8 }}>
        {loading ? 'Sending...' : 'Send Request'}
      </button>
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}
      {response && (
        <pre style={{ background: '#f4f4f4', padding: 10, borderRadius: 4, maxHeight: 300, overflow: 'auto' }}>{response}</pre>
      )}
      {polling && <div style={{ color: '#888', marginBottom: 8 }}>Polling for address...</div>}
      {addressInfo && (
        <div style={{ background: '#f6f6f6', padding: 10, borderRadius: 4, marginTop: 8 }}>
          {addressInfo.zec_amount && (
            <div><b>ZEC Amount:</b> {addressInfo.zec_amount}</div>
          )}
          <div><b>Address:</b> {addressInfo.address}</div>
          <div><b>Container Status:</b> {addressInfo.container_status}</div>
          <div><b>Runtime (min):</b> {addressInfo.runtime_minutes}</div>
        </div>
      )}
      {isCreate && (
        <div style={{ marginBottom: 8 }}>
          <label>Stress Test Count: <input type="number" min={1} max={100} value={stressCount} onChange={e => setStressCount(Number(e.target.value))} style={{ width: 60, marginRight: 8 }} /></label>
          <button onClick={handleStressTest} disabled={stressLoading || loading} style={{ marginRight: 8 }}>
            {stressLoading ? 'Running...' : 'Run Stress Test'}
          </button>
        </div>
      )}
      {stressResults.length > 0 && (
        <div style={{ marginBottom: 8, fontSize: '0.95em' }}>
          <b>Stress Test Results:</b>
          <ul style={{ maxHeight: 300, overflow: 'auto', background: '#f9f9f9', padding: 8, borderRadius: 4 }}>
            {stressResults.map(r => (
              <li key={r.i} style={{ color: r.status === 200 || r.status === 202 ? 'green' : 'red', marginBottom: 10 }}>
                <div><b>#{r.i + 1}:</b> Status <b>{r.status}</b></div>
                <div style={{ fontSize: '0.92em', color: '#444', margin: '2px 0' }}><b>Request:</b> <code style={{ wordBreak: 'break-all' }}>{r.requestBody}</code></div>
                <div style={{ fontSize: '0.92em', color: '#444', margin: '2px 0' }}><b>Response:</b> <code style={{ wordBreak: 'break-all' }}>{r.body}</code></div>
                {typeof r.timeToAddress === 'number' && (
                  <div style={{ fontSize: '0.92em', color: '#444', margin: '2px 0' }}>
                    <b>Time to Address Response:</b> {(r.timeToAddress / 1000).toFixed(2)}s
                  </div>
                )}
                {r.addressPoll && (
                  <div style={{ fontSize: '0.92em', color: '#444', margin: '2px 0' }}>
                    <b>Address Poll:</b> {r.addressPoll.found ? 'Found' : 'Not Found'} after {r.addressPoll.tries} tries
                    <pre style={{ background: '#eee', color: '#222', padding: 4, borderRadius: 3, maxWidth: 500, overflowX: 'auto' }}>{JSON.stringify(r.addressPoll.data || r.addressPoll.error, null, 2)}</pre>
                  </div>
                )}
              </li>
            ))}
          </ul>
          {/* Stress test summary */}
          <div style={{ marginTop: 12, padding: 8, background: '#e9e9e9', borderRadius: 4, color: '#222', fontSize: '1em' }}>
            <b>Summary:</b> {stressResults.length} requests — 
            {(() => {
              const success = stressResults.filter(r => r.status === 200 || r.status === 202).length;
              const failed = stressResults.filter(r => r.status !== 200 && r.status !== 202).length;
              const times = stressResults.filter(r => typeof r.timeToAddress === 'number').map(r => r.timeToAddress);
              const avg = times.length ? (times.reduce((a, b) => a + b, 0) / times.length / 1000).toFixed(2) : 'N/A';
              return `${success} succeeded, ${failed} failed, avg. time to address: ${avg}s`;
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

function SwapTestSection({ userConfig }) {
  const [fromCurrency, setFromCurrency] = useState('BTC');
  const [amount, setAmount] = useState('');
  const [userId, setUserId] = useState('');
  const [invoiceId, setInvoiceId] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const apiKey = userConfig?.apiKey || import.meta.env.VITE_API_KEY;

  const handleSend = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const res = await fetch(`${API_BASE_URL}/swap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          from_currency: fromCurrency,
          amount,
          user_id: userId,
          invoice_id: invoiceId
        }),
      });
      const text = await res.text();
      setResponse(text);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <h2>Test Swap Endpoint</h2>
      <div style={{ marginBottom: 8 }}>
        <label>From Currency: <input value={fromCurrency} onChange={e => setFromCurrency(e.target.value)} style={{ width: '40%' }} /></label>
      </div>
      <div style={{ marginBottom: 8 }}>
        <label>Amount: <input value={amount} onChange={e => setAmount(e.target.value)} style={{ width: '40%' }} /></label>
      </div>
      <div style={{ marginBottom: 8 }}>
        <label>User ID: <input value={userId} onChange={e => setUserId(e.target.value)} style={{ width: '40%' }} /></label>
      </div>
      <div style={{ marginBottom: 8 }}>
        <label>Invoice ID: <input value={invoiceId} onChange={e => setInvoiceId(e.target.value)} style={{ width: '40%' }} /></label>
      </div>
      <div style={{ marginBottom: 8 }}>
        <label>API Key: <input value={apiKey} disabled style={{ width: '60%' }} /></label>
      </div>
      <button onClick={handleSend} disabled={loading} style={{ marginBottom: 8 }}>
        {loading ? 'Sending...' : 'Send Swap Request'}
      </button>
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}
      {response && (
        <pre style={{ background: '#f4f4f4', padding: 10, borderRadius: 4, maxHeight: 300, overflow: 'auto' }}>{response}</pre>
      )}
    </div>
  );
}

function PayoutTestSection({ userConfig }) {
  const [apiKey, setApiKey] = useState(userConfig?.apiKey || import.meta.env.VITE_API_KEY);
  const [userId, setUserId] = useState('');
  const [invoiceId, setInvoiceId] = useState('');
  const [payoutAddress, setPayoutAddress] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [polling, setPolling] = useState(false);
  const [addressInfo, setAddressInfo] = useState(null);
  const pollingRef = useRef();

  // Update apiKey if userConfig changes
  useEffect(() => {
    if (userConfig?.apiKey && !apiKey) setApiKey(userConfig.apiKey);
  }, [userConfig, apiKey]);

  const handleSend = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    setAddressInfo(null);
    setPolling(false);
    clearTimeout(pollingRef.current);
    try {
      const res = await fetch(`${API_BASE_URL}/payout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          user_id: userId,
          invoice_id: invoiceId,
          payout_address: payoutAddress,
        }),
      });
      const text = await res.text();
      setResponse(text);
      if (!res.ok) {
        try {
            const jsonData = JSON.parse(text);
            throw new Error(jsonData.message || `HTTP error ${res.status}`);
        } catch (e) {
            // If parsing fails or it's already an error, re-throw
            if (e instanceof Error) throw e;
            throw new Error(`HTTP error ${res.status} - ${text}`);
        }
      }
      if (res.status === 202) { // Accepted, start polling
        setPolling(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Poll /address endpoint
  useEffect(() => {
    if (!polling) return;
    let stopped = false;
    async function poll() {
      if (stopped) return;
      try {
        const params = new URLSearchParams({ api_key: apiKey, user_id: userId, invoice_id: invoiceId });
        const res = await fetch(`${API_BASE_URL}/address?${params.toString()}`);
        if (stopped) return; // Check again after await
        const data = await res.json();
        setAddressInfo(data);

        // Stop polling if a definitive status is reached or address is "found"
        // For payouts, "address" field might not be the primary indicator.
        // Container status is more important.
        // Example terminal statuses: 'completed', 'failed', 'error', 'payout_complete', 'payout_failed'
        // The current logic from ApiTestSection uses `data.address` and `data.not_found`.
        // We'll adapt this slightly, but ideally, the /address endpoint should provide a clear signal for payout completion.
        if (data.address && data.address !== 'Not Available Yet') { // This might need specific tuning for payout status
          setPolling(false);
          return;
        }
        if (data.not_found) {
          setPolling(false);
          return;
        }
        // Add more specific checks for payout terminal states if known
        if (data.container_status && ['completed', 'failed', 'error', 'payout_complete', 'payout_failed'].includes(data.container_status.toLowerCase())) {
            setPolling(false);
            return;
        }

        if (!stopped) pollingRef.current = setTimeout(poll, 3000); // Poll every 3 seconds
      } catch (e) {
        if (!stopped) {
          console.error("Polling error:", e);
          // Optionally set an error state for polling
          // setError(`Polling failed: ${e.message}`);
          setPolling(false); // Stop polling on error
        }
      }
    }
    poll();
    return () => {
      stopped = true;
      clearTimeout(pollingRef.current);
    };
  }, [polling, apiKey, userId, invoiceId]);

  return (
    <div style={{ maxWidth: 600 }}>
      <h2>Test Payout Endpoint</h2>
      <div style={{ marginBottom: 8 }}>
        <label>API Key: <input value={apiKey} onChange={e => setApiKey(e.target.value)} style={{ width: '80%' }} /></label>
      </div>
      <div style={{ marginBottom: 8 }}>
        <label>User ID: <input value={userId} onChange={e => setUserId(e.target.value)} style={{ width: '80%' }} /></label>
      </div>
      <div style={{ marginBottom: 8 }}>
        <label>Invoice ID: <input value={invoiceId} onChange={e => setInvoiceId(e.target.value)} style={{ width: '80%' }} /></label>
      </div>
      <div style={{ marginBottom: 8 }}>
        <label>Payout Address (t-addr or z-addr): <input value={payoutAddress} onChange={e => setPayoutAddress(e.target.value)} style={{ width: '80%' }} /></label>
      </div>
      <button onClick={handleSend} disabled={loading} style={{ marginBottom: 8 }}>
        {loading ? 'Sending...' : 'Send Payout Request'}
      </button>
      {error && <div style={{ color: 'red', marginBottom: 8 }}>Error: {error}</div>}
      {response && (
        <pre style={{ background: '#f4f4f4', padding: 10, borderRadius: 4, maxHeight: 150, overflow: 'auto', marginBottom: 8 }}>{response}</pre>
      )}
      {polling && <div style={{ color: '#888', marginBottom: 8 }}>Polling for payout status...</div>}
      {addressInfo && (
        <div style={{ background: '#f6f6f6', padding: 10, borderRadius: 4, marginTop: 8, fontSize: '0.9em' }}>
          <h4>Payout Status Information:</h4>
          {addressInfo.zec_amount !== undefined && ( // May not be relevant for payout but good to show if present
            <div><b>ZEC Amount:</b> {addressInfo.zec_amount}</div>
          )}
          {addressInfo.address && ( // This is the user's payout_address, already known, but good to confirm
            <div><b>Target Address:</b> {addressInfo.address}</div>
          )}
          {addressInfo.container_status !== undefined && (
            <div><b>Container Status:</b> {addressInfo.container_status}</div>
          )}
          {addressInfo.runtime_minutes !== undefined && (
            <div><b>Runtime (min):</b> {addressInfo.runtime_minutes}</div>
          )}
           {addressInfo.message && ( // General message from /address
            <div><b>Message:</b> {addressInfo.message}</div>
          )}
          {addressInfo.not_found && (
            <div style={{color: 'orange'}}><b>Info:</b> Address/Invoice data not found. Polling stopped.</div>
          )}
        </div>
      )}
    </div>
  );
}

function App() {
  const [activeSection, setActiveSection] = useState('settings');
  const [userConfig, setUserConfig] = useState(null);
  const [userConfigLoading, setUserConfigLoading] = useState(true);
  const [userConfigError, setUserConfigError] = useState(null);
  const apiKey = userConfig?.apiKey ? userConfig.apiKey : import.meta.env.VITE_API_KEY;

  useEffect(() => {
    setUserConfigLoading(true);
    setUserConfigError(null);
    fetch(`${API_BASE_URL}/user-config?api_key=${apiKey}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch user config');
        return res.json();
      })
      .then((data) => setUserConfig(data))
      .catch((err) => setUserConfigError(err.message))
      .finally(() => setUserConfigLoading(false));
  }, []);

  return (
    <div className="admin-panel full-screen">
      <aside className="sidebar">
        <div className="sidebar-title">Admin Panel</div>
        <nav>
          {sections.map((section) => (
            <button
              key={section.key}
              className={`sidebar-link${activeSection === section.key ? ' active' : ''}`}
              onClick={() => setActiveSection(section.key)}
            >
              {section.label}
            </button>
          ))}
        </nav>
      </aside>
      <div className="main-content">
        <header className="topbar">ZPay Admin</header>
        <section className="content-area">
          {activeSection === 'settings' && <UserConfigDetails userConfig={userConfig} setUserConfig={setUserConfig} loading={userConfigLoading} error={userConfigError} />}
          {activeSection === 'transactions' && <TransactionsTable />}
          {activeSection === 'apiTest' && <ApiTestSection userConfig={userConfig} />}
          {activeSection === 'swapTest' && <SwapTestSection userConfig={userConfig} />}
          {activeSection === 'payoutTest' && <PayoutTestSection userConfig={userConfig} />}
        </section>
      </div>
    </div>
  );
}

export default App; 