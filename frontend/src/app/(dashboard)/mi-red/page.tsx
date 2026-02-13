'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Users, UserMinus, ChevronRight } from 'lucide-react';

export default function MiRedPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [network, setNetwork] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [membersRes, networkRes] = await Promise.all([
        api.get('/networks/members'),
        api.get('/networks/mine')
      ]);
      setMembers(membersRes.data.members);
      setStats(membersRes.data.stats);
      setNetwork(networkRes.data.network);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleRemove = async (memberId: string, memberName: string) => {
    if (!confirm(`¿Remover a ${memberName} de la red?`)) return;
    try {
      await api.delete(`/networks/members/${memberId}`);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const getLevelName = (role: string) => {
    if (!network) return role;
    const map: Record<string, string> = {
      empresarial: network.levelNames.level1,
      gerente: network.levelNames.level2,
      lider: network.levelNames.level3,
      distribuidor: network.levelNames.level4,
      emprendedor: network.levelNames.level5
    };
    return map[role] || role;
  };

  const renderMember = (member: any, depth = 0) => (
    <div key={member._id}>
      <div className={`flex items-center justify-between py-3 px-4 hover:bg-gray-50 border-b`}
        style={{ paddingLeft: `${16 + depth * 24}px` }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm font-bold">
            {member.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-800">{member.name}</p>
            <p className="text-xs text-gray-500">{getLevelName(member.role)} · {member.phone}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={member.status} />
          <button onClick={() => handleRemove(member._id, member.name)}
            className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Remover de la red">
            <UserMinus size={16} />
          </button>
        </div>
      </div>
      {member.subordinates?.map((sub: any) => renderMember(sub, depth + 1))}
    </div>
  );

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Mi Red</h1>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card title="Total miembros" value={stats.total} icon={<Users size={24} />} color="blue" />
          <Card title="Activos" value={stats.activos} color="emerald" />
          <Card title="En trial" value={stats.trial} color="amber" />
          <Card title="Inactivos" value={stats.inactivos} color="red" />
        </div>
      )}

      <Card title={network?.name || 'Mi Red'}>
        {members.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No tienes miembros en tu red. Comparte tu enlace de invitación para crecer.
          </p>
        ) : (
          <div className="divide-y-0">{members.map((m) => renderMember(m))}</div>
        )}
      </Card>
    </div>
  );
}
