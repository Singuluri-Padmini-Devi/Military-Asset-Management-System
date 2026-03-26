import { useEffect, useMemo, useState } from "react";
import api from "../api/client";
import MovementModal from "../components/MovementModal";

export default function Dashboard() {
  const [data, setData] = useState({ totals: {}, assets: [] });
  const [filter, setFilter] = useState({ base: "", category: "" });
  const [modalOpen, setModalOpen] = useState(false);

  const fetchData = async () => {
    const { data: response } = await api.get("/dashboard", { params: filter });
    setData(response);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(data.assets.map((a) => a.category))),
    [data.assets]
  );

  const filteredAssets = data.assets.filter((asset) => {
    const baseOk = !filter.base || asset.base.toLowerCase().includes(filter.base.toLowerCase());
    const categoryOk = !filter.category || asset.category === filter.category;
    return baseOk && categoryOk;
  });

  return (
    <section>
      <h1>Dashboard</h1>
      <div className="cards">
        <div className="card small"><h3>Assets</h3><p>{data.totals.assets || 0}</p></div>
        <div className="card small"><h3>Purchases</h3><p>{data.totals.purchases || 0}</p></div>
        <div className="card small"><h3>Transfers</h3><p>{data.totals.transfers || 0}</p></div>
        <div className="card small"><h3>Assignments</h3><p>{data.totals.assignments || 0}</p></div>
      </div>

      <div className="filters">
        <input
          placeholder="Filter by base"
          value={filter.base}
          onChange={(e) => setFilter((s) => ({ ...s, base: e.target.value }))}
        />
        <select
          value={filter.category}
          onChange={(e) => setFilter((s) => ({ ...s, category: e.target.value }))}
        >
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={fetchData}>Apply</button>
        <button onClick={() => setModalOpen(true)}>Net Movement Detail</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Asset</th>
              <th>Category</th>
              <th>Base</th>
              <th>Quantity</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssets.map((asset) => (
              <tr key={asset._id}>
                <td>{asset.assetName}</td>
                <td>{asset.category}</td>
                <td>{asset.base}</td>
                <td>{asset.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <MovementModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        items={filteredAssets}
        title="Net Asset Movement"
      />
    </section>
  );
}
