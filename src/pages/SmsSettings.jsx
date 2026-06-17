import { useEffect, useState, useCallback } from 'react';
import api from '../api/client';

const TIMEZONES = [
  { label: 'US — Eastern (New York)', value: 'America/New_York' },
  { label: 'US — Central (Chicago)', value: 'America/Chicago' },
  { label: 'US — Mountain (Denver)', value: 'America/Denver' },
  { label: 'US — Mountain no DST (Phoenix)', value: 'America/Phoenix' },
  { label: 'US — Pacific (Los Angeles)', value: 'America/Los_Angeles' },
  { label: 'US — Alaska (Anchorage)', value: 'America/Anchorage' },
  { label: 'US — Hawaii (Honolulu)', value: 'Pacific/Honolulu' },
  { label: 'Canada — Atlantic (Halifax)', value: 'America/Halifax' },
  { label: 'Canada — Pacific (Vancouver)', value: 'America/Vancouver' },
  { label: 'Europe — London', value: 'Europe/London' },
  { label: 'Europe — Paris / Berlin', value: 'Europe/Paris' },
  { label: 'Asia — Tokyo', value: 'Asia/Tokyo' },
  { label: 'Asia — Ho Chi Minh City', value: 'Asia/Ho_Chi_Minh' },
  { label: 'Asia — Bangkok', value: 'Asia/Bangkok' },
  { label: 'Asia — Singapore', value: 'Asia/Singapore' },
  { label: 'Australia — Sydney', value: 'Australia/Sydney' },
];

const TEMPLATE_LABELS = {
  booking_confirm: 'Booking Confirmation',
  checkin_confirm: 'Walk-in Check-in',
  eod_thankyou: 'End-of-Day Thank You',
  birthday: 'Birthday Greeting',
  manager_booking_alert: 'Manager Booking Alert',
};

const TEMPLATE_VARS = {
  booking_confirm: ['{name}', '{time}', '{technician}', '{salon}', '{confirmation}', '{notes}'],
  checkin_confirm: ['{name}', '{salon}'],
  eod_thankyou: ['{name}', '{salon}'],
  birthday: ['{name}', '{salon}'],
  manager_booking_alert: ['{name}', '{phone}', '{service}', '{technician}', '{time}', '{confirmation}', '{notes}'],
};

const TEMPLATE_VAR_HINTS = {
  '{technician}': '→ " with Amy" nếu khách chọn kỹ thuật viên; rỗng nếu chọn anyone',
  '{notes}': '→ "\\nSpecial requests: ..." nếu khách có ghi chú; rỗng nếu không có',
  '{phone}': '→ số điện thoại của khách',
  '{service}': '→ tên dịch vụ khách đặt',
};

function TemplateCard({ tpl, onSave }) {
  const [body, setBody] = useState(tpl.body);
  const [enabled, setEnabled] = useState(tpl.enabled);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const dirty = body !== tpl.body || enabled !== tpl.enabled;

  const handleSave = async () => {
    setSaving(true);
    await onSave(tpl.type, { body, enabled });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">{TEMPLATE_LABELS[tpl.type]}</h3>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4 rounded accent-primary"
          />
          Enabled
        </label>
      </div>

      <div className="mb-2 flex flex-wrap gap-1.5">
        {TEMPLATE_VARS[tpl.type].map((v) => (
          <span
            key={v}
            onClick={() => setBody((b) => b + v)}
            className="cursor-pointer rounded-full bg-rose-50 px-2 py-0.5 text-xs font-mono text-primary hover:bg-rose-100"
            title={TEMPLATE_VAR_HINTS[v] || 'Click to insert'}
          >
            {v}
          </span>
        ))}
      </div>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-slate-400">{body.length} chars</span>
        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-white transition hover:bg-primary/90 disabled:opacity-40"
        >
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save'}
        </button>
      </div>
    </div>
  );
}

export default function SmsSettings() {
  const [templates, setTemplates] = useState([]);
  const [settings, setSettings] = useState(null);
  const [managerPhones, setManagerPhones] = useState(['']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Test SMS state
  const [testTo, setTestTo] = useState('');
  const [testBody, setTestBody] = useState('');
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState('');

  // Settings save state
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/api/sms/templates'),
      api.get('/api/sms/settings'),
    ])
      .then(([tplRes, setRes]) => {
        setTemplates(tplRes.data.templates);
        setSettings(setRes.data);
        const phones = setRes.data.managerPhones || [];
        setManagerPhones(phones.length ? phones : ['']);
      })
      .catch((e) => setError(e.response?.data?.error || e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveTemplate = useCallback(async (type, updates) => {
    const { data } = await api.put(`/api/sms/templates/${type}`, updates);
    setTemplates((prev) => prev.map((t) => (t.type === type ? data.template : t)));
  }, []);

  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    try {
      const cleanPhones = managerPhones.map((p) => p.trim()).filter(Boolean);
      const { data } = await api.put('/api/sms/settings', { ...settings, managerPhones: cleanPhones });
      setSettings(data);
      const phones = data.managerPhones || [];
      setManagerPhones(phones.length ? phones : ['']);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2000);
    } catch (e) {
      alert(e.response?.data?.error || e.message);
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleTestSms = async () => {
    if (!testTo || !testBody) return;
    setTestSending(true);
    setTestResult('');
    try {
      await api.post('/api/sms/test', { to: testTo, body: testBody });
      setTestResult('Sent successfully!');
    } catch (e) {
      setTestResult('Error: ' + (e.response?.data?.error || e.message));
    } finally {
      setTestSending(false);
    }
  };

  if (loading) return <div className="p-6 text-sm text-slate-500">Loading…</div>;
  if (error) return <div className="p-6 text-sm text-red-500">{error}</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">SMS Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Configure automated SMS messages. Twilio credentials must be set in backend environment variables.
        </p>
      </div>

      {/* Cron schedule */}
      {settings && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-800">Scheduled Send Times</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">
                End-of-Day SMS (HH:MM)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={settings.eodTime}
                  onChange={(e) => setSettings((s) => ({ ...s, eodTime: e.target.value }))}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <label className="flex items-center gap-1.5 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={settings.eodEnabled}
                    onChange={(e) => setSettings((s) => ({ ...s, eodEnabled: e.target.checked }))}
                    className="accent-primary"
                  />
                  On
                </label>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">
                Birthday SMS (HH:MM)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={settings.birthdayTime}
                  onChange={(e) => setSettings((s) => ({ ...s, birthdayTime: e.target.value }))}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <label className="flex items-center gap-1.5 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={settings.birthdayEnabled}
                    onChange={(e) => setSettings((s) => ({ ...s, birthdayEnabled: e.target.checked }))}
                    className="accent-primary"
                  />
                  On
                </label>
              </div>
            </div>
          </div>
          <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-slate-600">
                Manager phones — receive SMS on every new booking
              </label>
              <button
                type="button"
                onClick={() => setManagerPhones((prev) => [...prev, ''])}
                className="rounded-lg bg-rose-50 px-3 py-1 text-xs font-medium text-primary hover:bg-rose-100"
              >
                + Add number
              </button>
            </div>
            <div className="space-y-2">
              {managerPhones.map((ph, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="tel"
                    value={ph}
                    onChange={(e) => {
                      const next = [...managerPhones];
                      next[idx] = e.target.value;
                      setManagerPhones(next);
                    }}
                    placeholder="(602) 555-0100"
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  {managerPhones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setManagerPhones((prev) => prev.filter((_, i) => i !== idx))}
                      className="rounded-lg px-2 py-2 text-slate-400 hover:bg-slate-100 hover:text-red-500"
                      title="Remove"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-1 text-xs text-slate-400">Leave all blank to disable manager notifications.</p>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-4">
            <label className="mb-1 block text-sm font-medium text-slate-600">
              Salon timezone
            </label>
            <select
              value={settings.timezone || 'America/Phoenix'}
              onChange={(e) => setSettings((s) => ({ ...s, timezone: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-400">
              Dùng để hiển thị giờ đúng múi giờ trên SMS và báo cáo.
            </p>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={settingsSaving}
              className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-40"
            >
              {settingsSaving ? 'Saving…' : settingsSaved ? 'Saved ✓' : 'Save'}
            </button>
          </div>
        </section>
      )}

      {/* Templates */}
      <section className="space-y-4">
        <h2 className="font-semibold text-slate-800">Message Templates</h2>
        <p className="text-xs text-slate-400">Click a variable chip to insert it into the message body.</p>
        {templates.map((tpl) => (
          <TemplateCard key={tpl.type} tpl={tpl} onSave={handleSaveTemplate} />
        ))}
      </section>

      {/* Test SMS */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-semibold text-slate-800">Send Test SMS</h2>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Phone number</label>
            <input
              type="tel"
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
              placeholder="(602) 555-0100"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Message body</label>
            <textarea
              value={testBody}
              onChange={(e) => setTestBody(e.target.value)}
              rows={3}
              placeholder="Type your test message…"
              className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleTestSms}
              disabled={!testTo || !testBody || testSending}
              className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600 disabled:opacity-40"
            >
              {testSending ? 'Sending…' : 'Send Test'}
            </button>
            {testResult && (
              <span className={`text-sm ${testResult.startsWith('Error') ? 'text-red-500' : 'text-green-600'}`}>
                {testResult}
              </span>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
