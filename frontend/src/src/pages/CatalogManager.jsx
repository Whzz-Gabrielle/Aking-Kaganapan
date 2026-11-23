import { useMemo, useState } from 'react';
import { packagesApi, venuesApi } from '../api/services.js';
import { ConfirmDialog, EmptyState, ErrorState, Field, FormAlert, Modal, Spinner } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { useFormError } from '../hooks/useFormError.js';
import { formatPrice } from '../utils/format.js';

const VENUE_TYPES = ['Hotel', 'Studio', 'Function Hall', 'Other Event Venue', 'Restaurant', 'Resort'];

// One screen definition per catalog. Each field maps straight onto the API model.
const CONFIGS = {
  packages: {
    api: packagesApi, singular: 'package', plural: 'Packages', nameKey: 'packageName', priceKey: 'price',
    subtitle: 'Event packages clients can choose when booking.',
    empty: { packageName: '', eventType: '', eventTheme: '', colorMotif: '', pax: 0, price: '', description: '', inclusions: '', imageUrl: '', isAvailable: true },
    fields: (f, set, err) => (<>
      <Field label="Package name *" error={err('packageName')}><input required value={f.packageName} onChange={set('packageName')} /></Field>
      <div className="form-grid">
        <Field label="Event type *" error={err('eventType')}><input required value={f.eventType} onChange={set('eventType')} placeholder="e.g. Wedding, Birthday" /></Field>
        <Field label="Price (₱) *" error={err('price')}><input type="number" required min="0" step="0.01" value={f.price} onChange={set('price')} /></Field>
      </div>
      <div className="form-grid">
        <Field label="Theme"><input value={f.eventTheme} onChange={set('eventTheme')} /></Field>
        <Field label="Color motif"><input value={f.colorMotif} onChange={set('colorMotif')} /></Field>
      </div>
      <Field label="Guests (pax)" error={err('pax')}><input type="number" min="0" value={f.pax} onChange={set('pax')} /></Field>
    </>),
    columns: [['PACKAGE', (p) => <><strong>{p.packageName}</strong><small className="table-sub">{p.eventType}</small></>], ['PAX', (p) => p.pax || '—'], ['PRICE', (p) => formatPrice(p.price)]],
  },
  venues: {
    api: venuesApi, singular: 'venue', plural: 'Venues', nameKey: 'venueName', priceKey: 'rentalPrice',
    subtitle: 'Venues clients can choose when booking.',
    empty: { venueName: '', venueType: 'Other Event Venue', address: '', capacity: '', rentalPrice: 0, eventTheme: '', colorMotif: '', description: '', inclusions: '', imageUrl: '', isAvailable: true },
    fields: (f, set, err) => (<>
      <Field label="Venue name *" error={err('venueName')}><input required value={f.venueName} onChange={set('venueName')} /></Field>
      <div className="form-grid">
        <Field label="Type *"><select value={f.venueType} onChange={set('venueType')}>{VENUE_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
        <Field label="Capacity *" error={err('capacity')}><input type="number" required min="1" value={f.capacity} onChange={set('capacity')} /></Field>
      </div>
      <Field label="Address *" error={err('address')}><input required value={f.address} onChange={set('address')} /></Field>
      <Field label="Rental price (₱)" error={err('rentalPrice')}><input type="number" min="0" step="0.01" value={f.rentalPrice} onChange={set('rentalPrice')} /></Field>
    </>),
    columns: [['VENUE', (v) => <><strong>{v.venueName}</strong><small className="table-sub">{v.address}</small></>], ['TYPE / CAPACITY', (v) => <>{v.venueType}<small className="table-sub">Up to {v.capacity}</small></>], ['RENTAL', (v) => (v.rentalPrice > 0 ? formatPrice(v.rentalPrice) : 'Ask for rate')]],
  },
};

export const ManagePackages = () => <CatalogManager kind="packages" />;
export const ManageVenues = () => <CatalogManager kind="venues" />;

function toForm(config, item) {
  const base = { ...config.empty, ...item };
  base.inclusions = Array.isArray(item?.inclusions) ? item.inclusions.join(', ') : base.inclusions || '';
  return base;
}

function CatalogManager({ kind }) {
  const config = CONFIGS[kind];
  const { setMessage } = useAuth();
  const { data, loading, error, reload, mutate } = useApi(config.api.list);
  const [editing, setEditing] = useState(null); // item, or {} when adding
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const formError = useFormError();
  const items = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  async function toggleAvailability(item) {
    try {
      const res = await config.api.update(item._id, { isAvailable: !item.isAvailable });
      mutate((old) => (old || []).map((i) => (i._id === item._id ? res[config.singular] : i)));
    } catch (err) { setMessage('error', err.message); }
  }

  async function confirmDelete() {
    setBusy(true); formError.clear();
    try {
      const res = await config.api.remove(deleting._id);
      mutate((old) => (old || []).filter((i) => i._id !== deleting._id));
      setDeleting(null); setMessage('success', res.message);
    } catch (err) { formError.setError(err); }
    finally { setBusy(false); }
  }

  return (
    <section className="dashboard-page">
      <div className="page-heading">
        <div><span className="eyebrow">COORDINATOR WORKSPACE</span><h1>Manage <em>{config.plural.toLowerCase()}.</em></h1><p>{config.subtitle} Unavailable items are hidden from clients.</p></div>
        <button className="btn btn-primary" onClick={() => { formError.clear(); setEditing({}); }}>＋ Add {config.singular}</button>
      </div>
      <section className="content-card">
        <div className="content-card-head"><div><h2>All {config.plural.toLowerCase()}</h2><p>{items.length} total</p></div><button className="btn btn-outline btn-sm" onClick={reload} disabled={loading}>↻ Refresh</button></div>
        {error && items.length > 0 && <FormAlert message={`Could not refresh: ${error}`} />}
        {loading && !data ? <Spinner label={`Loading ${config.plural.toLowerCase()}…`} /> : error && !data ? <ErrorState message={error} onRetry={reload} /> : items.length === 0 ? (
          <EmptyState title={`No ${config.plural.toLowerCase()} yet`}>Add your first {config.singular} so clients can choose it.</EmptyState>
        ) : (
          <div className="table-wrap"><table>
            <thead><tr>{config.columns.map(([h]) => <th key={h}>{h}</th>)}<th>AVAILABLE</th><th /></tr></thead>
            <tbody>{items.map((item) => (
              <tr key={item._id} className={item.isAvailable ? '' : 'row-muted'}>
                {config.columns.map(([h, render]) => <td key={h}>{render(item)}</td>)}
                <td><label className="switch"><input type="checkbox" checked={item.isAvailable} onChange={() => toggleAvailability(item)} aria-label={`Available: ${item[config.nameKey]}`} /><span>{item.isAvailable ? 'Yes' : 'No'}</span></label></td>
                <td><div className="row-actions"><button className="btn btn-outline btn-xs" onClick={() => { formError.clear(); setEditing(item); }}>Edit</button><button className="btn btn-danger-ghost btn-xs" onClick={() => { formError.clear(); setDeleting(item); }}>Delete</button></div></td>
              </tr>))}</tbody>
          </table></div>
        )}
      </section>

      {editing && <ItemForm config={config} item={editing} onClose={() => setEditing(null)}
        onSaved={(res, isNew) => {
          const saved = res[config.singular];
          mutate((old) => (isNew ? [saved, ...(old || [])] : (old || []).map((i) => (i._id === saved._id ? saved : i))));
          setEditing(null); setMessage('success', res.message);
        }} />}

      {deleting && <ConfirmDialog title={`Delete this ${config.singular}?`} message={`“${deleting[config.nameKey]}” will be removed. If bookings already use it, mark it unavailable instead.`}
        confirmLabel="Delete" danger busy={busy} error={formError.message} onConfirm={confirmDelete} onCancel={() => { setDeleting(null); formError.clear(); }} />}
    </section>
  );
}

function ItemForm({ config, item, onClose, onSaved }) {
  const isNew = !item._id;
  const [form, setForm] = useState(() => toForm(config, item));
  const [busy, setBusy] = useState(false);
  const formError = useFormError();
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  async function submit(event) {
    event.preventDefault(); setBusy(true); formError.clear();
    try {
      const res = isNew ? await config.api.create(form) : await config.api.update(item._id, form);
      onSaved(res, isNew);
    } catch (err) { formError.setError(err); setBusy(false); }
  }

  return (
    <Modal eyebrow={isNew ? 'NEW' : 'EDIT'} title={`${isNew ? 'Add' : 'Edit'} ${config.singular}`} onClose={busy ? () => {} : onClose}>
      <form className="form-stack" onSubmit={submit}>
        <FormAlert message={formError.message} />
        {config.fields(form, set, formError.field)}
        <Field label="Description"><textarea rows="3" value={form.description} onChange={set('description')} /></Field>
        <Field label="Inclusions" hint="Separate items with commas or new lines."><textarea rows="3" value={form.inclusions} onChange={set('inclusions')} /></Field>
        <Field label="Image URL" hint="Optional link to a photo."><input type="url" value={form.imageUrl} onChange={set('imageUrl')} placeholder="https://…" /></Field>
        <label className="switch"><input type="checkbox" checked={form.isAvailable} onChange={set('isAvailable')} /><span>Available to clients</span></label>
        <div className="modal-actions"><button type="button" className="btn btn-outline" onClick={onClose} disabled={busy}>Cancel</button><button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button></div>
      </form>
    </Modal>
  );
}
