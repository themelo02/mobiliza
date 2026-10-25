import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Check, ChevronDown, ChevronUp, X, Search, Plus, MapPin } from 'lucide-react';

interface MultiBairroSelectorProps {
  value: string; // Ex: "Salinas, Baixo Cubal" ou ""
  onChange: (newValue: string) => void;
  todosBairros: string[];
  bairrosCoordenacao?: string[];
  coordenacaoNome?: string;
  apenasCoordenacao?: boolean; // Se true, o supervisor só vê os bairros da sua coordenação
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export const MultiBairroSelector: React.FC<MultiBairroSelectorProps> = ({
  value,
  onChange,
  todosBairros,
  bairrosCoordenacao = [],
  coordenacaoNome,
  apenasCoordenacao = true,
  required = false,
  disabled = false,
  placeholder = 'Clique para marcar os Bairros visitados',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [customBairroInput, setCustomBairroInput] = useState('');
  const [showAddCustom, setShowAddCustom] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Lista dos bairros atualmente marcados
  const selectedList = useMemo(() => {
    if (!value) return [];
    return value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }, [value]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Alternar marcação de um bairro
  const toggleBairro = (bairro: string) => {
    let next: string[];
    if (selectedList.includes(bairro)) {
      next = selectedList.filter((b) => b !== bairro);
    } else {
      next = [...selectedList, bairro];
    }
    onChange(next.join(', '));
  };

  // Marcar todos os bairros da coordenação
  const handleSelectAllCoord = () => {
    const combined = Array.from(new Set([...selectedList, ...bairrosCoordenacao]));
    onChange(combined.join(', '));
  };

  // Limpar todos os bairros marcados
  const handleClearAll = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onChange('');
  };

  // Adicionar um bairro personalizado
  const handleAddCustomBairro = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customBairroInput.trim();
    if (!trimmed) return;
    if (!selectedList.includes(trimmed)) {
      const next = [...selectedList, trimmed];
      onChange(next.join(', '));
    }
    setCustomBairroInput('');
    setShowAddCustom(false);
  };

  // Filtragem dos bairros pelo termo de pesquisa
  const filteredCoordBairros = useMemo(() => {
    if (!searchTerm.trim()) return bairrosCoordenacao;
    return bairrosCoordenacao.filter((b) =>
      b.toLowerCase().includes(searchTerm.toLowerCase().trim())
    );
  }, [bairrosCoordenacao, searchTerm]);

  const filteredOutrosBairros = useMemo(() => {
    const list = todosBairros.filter((b) => !bairrosCoordenacao.includes(b));
    if (!searchTerm.trim()) return list;
    return list.filter((b) => b.toLowerCase().includes(searchTerm.toLowerCase().trim()));
  }, [todosBairros, bairrosCoordenacao, searchTerm]);

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Campo Fechado Compacto (não ocupa espaço na tela) */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full min-h-[42px] px-3 py-2 bg-white border rounded-lg flex items-center justify-between gap-2 cursor-pointer transition select-none ${
          disabled
            ? 'bg-slate-100 border-slate-200 cursor-not-allowed text-slate-400'
            : isOpen
            ? 'border-[#2667ff] ring-2 ring-blue-100 shadow-xs'
            : selectedList.length > 0
            ? 'border-blue-300 bg-blue-50/20'
            : 'border-slate-300 hover:border-slate-400'
        }`}
        title="Clique para abrir e marcar um ou mais bairros"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
          <MapPin
            className={`w-4 h-4 shrink-0 ${
              selectedList.length > 0 ? 'text-[#2667ff]' : 'text-slate-400'
            }`}
          />
          {selectedList.length === 0 ? (
            <span className="text-xs sm:text-sm text-slate-400 truncate">
              {placeholder}
            </span>
          ) : (
            <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
              <span className="bg-[#2667ff] text-white text-[11px] font-extrabold px-2 py-0.5 rounded-full shrink-0">
                {selectedList.length} {selectedList.length === 1 ? 'bairro' : 'bairros'}
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                {selectedList.join(', ')}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {selectedList.length > 0 && !disabled && (
            <button
              type="button"
              onClick={handleClearAll}
              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
              title="Limpar todos os bairros marcados"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <div className="text-slate-500">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {/* Input oculto para validação nativa de HTML5 caso required */}
      {required && (
        <input
          type="text"
          value={value}
          required
          onChange={() => {}}
          tabIndex={-1}
          className="sr-only opacity-0 h-0 w-0 absolute"
          aria-hidden="true"
        />
      )}

      {/* Menu Desdobrável Flutuante (abre apenas ao clicar) */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 flex flex-col max-h-80 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Cabeçalho do Dropdown: Pesquisa e Ações Rápidas */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50/80 space-y-2 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Pesquisar bairro..."
                autoFocus
                className="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#2667ff] focus:ring-1 focus:ring-[#2667ff]"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] px-0.5">
              <span className="text-slate-500">
                Marcados: <strong className="text-blue-700">{selectedList.length}</strong>
              </span>
              <div className="flex items-center gap-2">
                {bairrosCoordenacao.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSelectAllCoord}
                    className="text-[#1a53db] hover:text-[#1848c4] font-semibold cursor-pointer"
                  >
                    Marcar Coordenação
                  </button>
                )}
                {selectedList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onChange('')}
                    className="text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                  >
                    Desmarcar Todos
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Lista com Checkboxes com Scroll Suave */}
          <div className="overflow-y-auto flex-1 p-2 space-y-3 divide-y divide-slate-100">
            {/* Seção 1: Bairros da Coordenação do Supervisor */}
            {filteredCoordBairros.length > 0 ? (
              <div className="space-y-1">
                <div className="text-[10px] uppercase font-bold text-blue-700 px-2 py-0.5 flex items-center justify-between">
                  <span>📍 Bairros da sua Coordenação {coordenacaoNome ? `(${coordenacaoNome})` : ''}</span>
                  <span className="text-blue-800 font-semibold bg-blue-100/80 px-1.5 py-0.5 rounded text-[10px]">
                    Sua Área de Trabalho
                  </span>
                </div>
                <div className="space-y-0.5">
                  {filteredCoordBairros.map((b) => {
                    const isChecked = selectedList.includes(b);
                    return (
                      <label
                        key={`coord-${b}`}
                        onClick={() => toggleBairro(b)}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition select-none text-xs font-semibold ${
                          isChecked
                            ? 'bg-blue-50/80 text-blue-900 border border-blue-200'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                              isChecked
                                ? 'bg-[#2667ff] border-[#2667ff] text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="truncate">{b}</span>
                        </div>
                        <span className="text-[10px] text-blue-600 font-extrabold bg-blue-100/70 px-1.5 py-0.2 rounded">
                          ★ Sua Coordenação
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ) : bairrosCoordenacao.length > 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">
                Nenhum bairro da sua coordenação corresponde a &quot;{searchTerm}&quot;.
              </div>
            ) : null}

            {/* Seção 2: Se a coordenação NÃO tiver bairros atribuídos ou se apenasCoordenacao for false */}
            {(!apenasCoordenacao || bairrosCoordenacao.length === 0) && filteredOutrosBairros.length > 0 && (
              <div className="space-y-1 pt-2">
                <div className="text-[10px] uppercase font-bold text-slate-500 px-2 py-0.5">
                  📋 Bairros Cadastrados no Sumbe
                </div>
                <div className="space-y-0.5">
                  {filteredOutrosBairros.map((b) => {
                    const isChecked = selectedList.includes(b);
                    return (
                      <label
                        key={`outro-${b}`}
                        onClick={() => toggleBairro(b)}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition select-none text-xs ${
                          isChecked
                            ? 'bg-blue-50/80 text-blue-900 font-semibold border border-blue-200'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                              isChecked
                                ? 'bg-[#2667ff] border-[#2667ff] text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="truncate">{b}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Se não encontrou nenhum bairro no filtro */}
            {((apenasCoordenacao && filteredCoordBairros.length === 0 && bairrosCoordenacao.length === 0) ||
              (!apenasCoordenacao && filteredCoordBairros.length === 0 && filteredOutrosBairros.length === 0)) && (
              <div className="py-4 text-center text-xs text-slate-400">
                Nenhum bairro encontrado para &quot;{searchTerm}&quot;.
              </div>
            )}

            {/* Seção 3: Inserir outro bairro personalizado se não estiver na lista */}
            <div className="pt-2">
              {!showAddCustom ? (
                <button
                  type="button"
                  onClick={() => setShowAddCustom(true)}
                  className="w-full text-left text-xs font-semibold text-[#1a53db] hover:text-[#1848c4] p-1.5 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Escrever outro bairro que não está na lista...</span>
                </button>
              ) : (
                <form onSubmit={handleAddCustomBairro} className="p-1 space-y-1.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-700 block">Novo Bairro / Aldeia:</span>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={customBairroInput}
                      onChange={(e) => setCustomBairroInput(e.target.value)}
                      placeholder="Ex: Bairro Salinas Norte"
                      autoFocus
                      className="flex-1 text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:border-[#2667ff] outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!customBairroInput.trim()}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded transition cursor-pointer"
                    >
                      Adicionar
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddCustom(false)}
                      className="px-2 py-1.5 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Rodapé do Dropdown com Botão Concluído */}
          <div className="p-2 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2 shrink-0">
            <span className="text-[11px] text-slate-500 truncate">
              {selectedList.length === 0 ? 'Nenhum selecionado' : `${selectedList.length} selecionado(s)`}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3.5 py-1.5 bg-[#2667ff] hover:bg-[#1a53db] text-white font-bold text-xs rounded-lg shadow-xs transition cursor-pointer"
            >
              Concluído
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
