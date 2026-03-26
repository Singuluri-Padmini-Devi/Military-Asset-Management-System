import { useEffect, useState } from "react";
import api from "../api/client";

const initial = {
  assetName: "",
  category: "Vehicle",
  base: "HQ",
  quantity: 1,
  unitCost: 0,
  note: "",
};

export default function Purchases() {
  const [form, setForm] = useState(initial);
  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState("");

  const load = async () => {
    const { data } = await api.get("/purchases");
    setRows(data);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    await api.post("/purchases", { ...form, quantity: Number(form.quantity), unitCost: Number(form.unitCost) });
    setForm(initial);
    setMessage("Purchase recorded");
    load();
  };

  return (
    <section>
      <h1>Purchases</h1>
      <form className="card form-grid" onSubmit={submit}>
        <input placeholder="Asset Name" value={form.assetName} onChange={(e) => setForm({ ...form, assetName: e.target.value })} required />
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          <option>Vehicle</option><option>Weapon</option><option>Ammunition</option><option>Equipment</option>
        </select>
        <input placeholder="Base" value={form.base} onChange={(e) => setForm({ ...form, base: e.target.value })} required />
        <input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
        <input type="number" min="0" value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: e.target.value })} />
        <input placeholder="Notes" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        <button type="submit">Save Purchase</button>
      </form>
      {message && <p className="success">{message}</p>}
      <div className="table-wrap"><table><thead><tr><th>Asset</th><th>Base</th><th>Qty</th><th>Category</th><th>Time</th></tr></thead><tbody>
        {rows.map((r) => <tr key={r._id}><td>{r.assetName}</td><td>{r.base}</td><td>{r.quantity}</td><td>{r.category}</td><td>{new Date(r.createdAt).toLocaleString()}</td></tr>)}
      </tbody></table></div>
    </section>
  );
}
