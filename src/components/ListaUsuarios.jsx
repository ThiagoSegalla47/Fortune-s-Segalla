import { useState, useEffect } from "react";
import axios from "axios";

export default function ListaUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("http://localhost:3001/usuarios")
      .then(res => {
        setUsuarios(res.data);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, []);

  if (loading) return <p className="text-center mt-10">Carregando...</p>;

  return (
    <div className="max-w-xl mx-auto mt-10 p-4 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Lista de Usuários</h1>
      <ul>
        {usuarios.map(user => (
          <li key={user.id} className="p-3 border-b last:border-b-0 hover:bg-gray-100 rounded">
            <p className="font-semibold">{user.nome}</p>
            <p className="text-gray-600">{user.email}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
