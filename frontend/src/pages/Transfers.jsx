import { useEffect, useState } from "react";
import api from "../api/client";

const initial = {
  assetName: "",
  category: "Vehicle",
  fromBase: "HQ",
  toBase: "",
  quantity: 1,
  note: "",
};

export default function Transfers() {
  const [form, setForm] = useState(initial);
  const [rows, setRows] = useState([]);

  const load = async () => {
    const { data } = await api.get("/transfers");
    setRows(data);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    await api.post("/transfers", { ...form, quantity: Number(form.quantity) });
    setForm(initial);
    load();
  };

  return (
    <section>
      <h1>Transfers</h1>
      <form className="card form-grid" onSubmit={submit}>
        <input placeholder="Asset Name" value={form.assetName} onChange={(e) => setForm({ ...form, assetName: e.target.value })} required />
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          <option>Vehicle</option><option>Weapon</option><option>Ammunition</option><option>Equipment</option>
        </select>
        <input placeholder="From Base" value={form.fromBase} onChange={(e) => setForm({ ...form, fromBase: e.target.value })} required />
        <input placeholder="To Base" value={form.toBase} onChange={(e) => setForm({ ...form, toBase: e.target.value })} required />
        <input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
        <input placeholder="Notes" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        <button type="submit">Transfer</button>
      </form>
      <div className="table-wrap"><table><thead><tr><th>Asset</th><th>From</th><th>To</th><th>Qty</th><th>Time</th></tr></thead><tbody>
        {rows.map((r) => <tr key={r._id}><td>{r.assetName}</td><td>{r.fromBase}</td><td>{r.toBase}</td><td>{r.quantity}</td><td>{new Date(r.createdAt).toLocaleString()}</td></tr>)}
      </tbody></table></div>
    </section>
  );
}
