/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Cloud, 
  Upload, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Flag, 
  AlertCircle,
  BarChart3,
  BookOpen,
  Loader2,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Markdown from "react-markdown";
import { Domain, Question, SimulationResult, Language } from "./types";
import { parseExamGuide, parseQuestionBank, analyzeResults, translateQuestion } from "./services/gemini";

type AppState = "IDLE" | "LOADING" | "WELCOME" | "SIMULATING" | "COLLECTING_INFO" | "RESULTS";

const translations = {
  pt: {
    title: "CertaCloud",
    subtitle: "Simulador de Certificação AWS",
    heroTitle: "Prepare-se para o Sucesso AWS",
    heroDesc: "Suba o Guia do Exame e o Banco de Questões para gerar um simulado personalizado com análise inteligente de desempenho.",
    guideTitle: "Guia do Exame",
    guideDesc: "PDF oficial da AWS com domínios e pesos da prova.",
    bankTitle: "Banco de Questões",
    bankDesc: "PDF contendo as questões objetivas para o simulado.",
    uploadPlaceholder: "Clique para upload ou arraste",
    questionCountLabel: "Quantidade de Questões:",
    generateBtn: "Gerar Simulado",
    loadingGuide: "Processando Guia do Exame...",
    loadingBank: "Indexando Banco de Questões...",
    loadingDesc: "O Agente de IA está analisando seus documentos...",
    readyTitle: "Simulado Pronto!",
    readyDesc: "Tudo configurado para sua prática.",
    rulesTitle: "Regras do Simulado",
    ruleQuestions: (count: number) => `**${count} questões** selecionadas aleatoriamente.`,
    ruleTime: (count: number) => `Tempo limite de **${count} minutos**.`,
    ruleFlag: "Use a **Bandeira** para marcar questões e revisar depois.",
    ruleTimeout: "O simulado encerra automaticamente se o tempo esgotar.",
    startBtn: "Iniciar Simulado",
    questionLabel: (current: number, total: number) => `Questão ${current} de ${total}`,
    markReview: "Marcar para Revisão",
    markedReview: "Marcada para Revisão",
    prevBtn: "Anterior",
    nextBtn: "Próxima",
    finishBtn: "Finalizar Simulado",
    progressTitle: "Progresso",
    answered: "Respondidas",
    forReview: "Para Revisão",
    pending: "Pendentes",
    scoreLabel: "Pontuação Final",
    scorePass: "Aprovado no Simulado",
    scoreFail: "Continue Praticando",
    timeLabel: "Tempo Utilizado",
    timeAvg: (avg: number) => `Média de ${avg}s por questão`,
    questionsLabel: "Questões",
    questionsTotal: "Acertos totais",
    aiAnalysisTitle: "Análise Inteligente CertaCloud",
    aiGenerating: "Gerando relatório...",
    newSimBtn: "Novo Simulado",
    footer: "Plataforma Interna de Treinamento AWS.",
    langLabel: "Idioma da Prova:",
    translateBtn: "Traduzir Questão",
    backBtn: "Voltar para a Prova",
    translating: "Traduzindo...",
    errorFiles: "Erro ao processar arquivos. Verifique se são PDFs válidos.",
    errorAnalysis: "Erro ao gerar análise inteligente.",
    warningCount: (extracted: number, requested: number) => `Aviso: Foram extraídas apenas ${extracted} questões do PDF, mas você solicitou ${requested}. O simulado prosseguirá com as questões disponíveis.`,
    collectInfoTitle: "Finalizar Simulado",
    collectInfoDesc: "Por favor, preencha seus dados para gerar o relatório final.",
    nameLabel: "Nome Completo",
    ageLabel: "Idade",
    submitResultsBtn: "Ver Resultados e Gerar Relatório",
    candidateInfo: "Informações do Candidato",
    candidateNameLabel: "Candidato:",
    candidateAgeLabel: "Idade:",
    evaluationDateLabel: "Data da Avaliação:"
  },
  en: {
    title: "CertaCloud",
    subtitle: "AWS Certification Simulator",
    heroTitle: "Prepare for AWS Success",
    heroDesc: "Upload the Exam Guide and Question Bank to generate a personalized simulation with intelligent performance analysis.",
    guideTitle: "Exam Guide",
    guideDesc: "Official AWS PDF with exam domains and weights.",
    bankTitle: "Question Bank",
    bankDesc: "PDF containing objective questions for the simulation.",
    uploadPlaceholder: "Click to upload or drag",
    questionCountLabel: "Number of Questions:",
    generateBtn: "Generate Simulation",
    loadingGuide: "Processing Exam Guide...",
    loadingBank: "Indexing Question Bank...",
    loadingDesc: "The AI Agent is analyzing your documents...",
    readyTitle: "Simulation Ready!",
    readyDesc: "Everything set for your practice.",
    rulesTitle: "Simulation Rules",
    ruleQuestions: (count: number) => `**${count} questions** randomly selected.`,
    ruleTime: (count: number) => `Time limit of **${count} minutes**.`,
    ruleFlag: "Use the **Flag** to mark questions for later review.",
    ruleTimeout: "The simulation ends automatically if time runs out.",
    startBtn: "Start Simulation",
    questionLabel: (current: number, total: number) => `Question ${current} of ${total}`,
    markReview: "Mark for Review",
    markedReview: "Marked for Review",
    prevBtn: "Previous",
    nextBtn: "Next",
    finishBtn: "Finish Simulation",
    progressTitle: "Progress",
    answered: "Answered",
    forReview: "For Review",
    pending: "Pending",
    scoreLabel: "Final Score",
    scorePass: "Passed Simulation",
    scoreFail: "Keep Practicing",
    timeLabel: "Time Used",
    timeAvg: (avg: number) => `Average ${avg}s per question`,
    questionsLabel: "Questions",
    questionsTotal: "Total correct",
    aiAnalysisTitle: "CertaCloud Intelligent Analysis",
    aiGenerating: "Generating report...",
    newSimBtn: "New Simulation",
    footer: "AWS Internal Training Platform.",
    langLabel: "Exam Language:",
    translateBtn: "Translate Question",
    backBtn: "Back to Exam",
    translating: "Translating...",
    errorFiles: "Error processing files. Please check if they are valid PDFs.",
    errorAnalysis: "Error generating intelligent analysis.",
    warningCount: (extracted: number, requested: number) => `Warning: Only ${extracted} questions were extracted from the PDF, but you requested ${requested}. The simulation will proceed with the available questions.`,
    collectInfoTitle: "Finish Simulation",
    collectInfoDesc: "Please fill in your details to generate the final report.",
    nameLabel: "Full Name",
    ageLabel: "Age",
    submitResultsBtn: "View Results and Generate Report",
    candidateInfo: "Candidate Information",
    candidateNameLabel: "Candidate:",
    candidateAgeLabel: "Age:",
    evaluationDateLabel: "Evaluation Date:"
  }
};

export default function App() {
  const [state, setState] = useState<AppState>("IDLE");
  const [loadingMessage, setLoadingMessage] = useState("");
  
  const [guideFile, setGuideFile] = useState<File | null>(null);
  const [bankFile, setBankFile] = useState<File | null>(null);
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [language, setLanguage] = useState<Language>("pt");
  
  const [domains, setDomains] = useState<Domain[]>([]);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [simulationQuestions, setSimulationQuestions] = useState<Question[]>([]);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string | null>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime, setStartTime] = useState(0);
  
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [candidateName, setCandidateName] = useState("");
  const [candidateAge, setCandidateAge] = useState("");

  const [translatedQuestion, setTranslatedQuestion] = useState<Question | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  const t = translations[language];

  const reportRef = useRef<HTMLDivElement>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(",")[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleGenerateSimulation = async () => {
    if (!guideFile || !bankFile) return;
    
    setState("LOADING");
    try {
      setLoadingMessage(t.loadingGuide);
      const guideBase64 = await fileToBase64(guideFile);
      const extractedDomains = await parseExamGuide(guideBase64, language);
      setDomains(extractedDomains);
      
      setLoadingMessage(t.loadingBank);
      const bankBase64 = await fileToBase64(bankFile);
      const extractedQuestions = await parseQuestionBank(bankBase64, questionCount, language);
      setAllQuestions(extractedQuestions);
      
      if (extractedQuestions.length === 0) {
        throw new Error("No questions found.");
      }

      if (extractedQuestions.length < questionCount) {
        alert(t.warningCount(extractedQuestions.length, questionCount));
      }
      
      setState("WELCOME");
    } catch (error) {
      console.error(error);
      alert(t.errorFiles);
      setState("IDLE");
    }
  };

  const startSimulation = () => {
    // Shuffle and pick questions
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(questionCount, allQuestions.length));
    
    setSimulationQuestions(selected);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setMarkedForReview({});
    setTimeLeft(questionCount * 60);
    setStartTime(Date.now());
    setState("SIMULATING");
  };

  useEffect(() => {
    if (state === "SIMULATING" && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            finishSimulation();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state, timeLeft]);

  const finishSimulation = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setState("COLLECTING_INFO");
  };

  const handleSubmitCandidateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateName || !candidateAge) return;

    const timeUsed = Math.floor((Date.now() - startTime) / 1000);
    const answers = simulationQuestions.map((q) => {
      const selected = userAnswers[q.id] || null;
      return {
        questionId: q.id,
        selectedOptionId: selected,
        isCorrect: selected === q.correctOptionId,
        isMarkedForReview: !!markedForReview[q.id],
      };
    });
    
    const correctCount = answers.filter((a) => a.isCorrect).length;
    const score = (correctCount / simulationQuestions.length) * 100;
    
    const finalResult: SimulationResult = {
      candidateName,
      candidateAge: parseInt(candidateAge),
      score,
      totalQuestions: simulationQuestions.length,
      timeUsed,
      answers,
    };
    
    setResult(finalResult);
    setState("RESULTS");
    
    // Start AI analysis
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeResults(
        domains, 
        simulationQuestions, 
        answers, 
        timeUsed, 
        language,
        candidateName,
        parseInt(candidateAge)
      );
      setAiAnalysis(analysis);
    } catch (error) {
      setAiAnalysis(t.errorAnalysis);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTranslateCurrentQuestion = async () => {
    const currentQ = simulationQuestions[currentQuestionIndex];
    if (!currentQ) return;
    
    setIsTranslating(true);
    try {
      // If current language is EN, translate to PT. If PT, translate to EN.
      const targetLang: Language = language === "en" ? "pt" : "en";
      const translated = await translateQuestion(currentQ, targetLang);
      setTranslatedQuestion(translated);
    } catch (error) {
      alert(t.errorAnalysis);
    } finally {
      setIsTranslating(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-[#F27D26] p-2 rounded-lg">
            <Cloud className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight text-[#0F172A]">Certa<span className="text-[#F27D26]">Cloud</span></h1>
            <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-400">{t.subtitle}</p>
          </div>
        </div>
        {state === "SIMULATING" && (
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono font-bold ${timeLeft < 60 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-700'}`}>
              <Clock size={18} />
              {formatTime(timeLeft)}
            </div>
            <button 
              onClick={finishSimulation}
              className="bg-[#0F172A] text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-slate-800 transition-colors"
            >
              {t.finishBtn}
            </button>
          </div>
        )}
      </header>

      <main className="max-w-5xl mx-auto p-6">
        <AnimatePresence mode="wait">
          {state === "IDLE" && (
            <motion.div 
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8 py-12"
            >
              <div className="text-center space-y-4">
                <h2 className="text-4xl font-bold text-[#0F172A] tracking-tight">{t.heroTitle}</h2>
                <p className="text-slate-500 max-w-2xl mx-auto text-lg">
                  {t.heroDesc}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Upload Guide */}
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:border-[#F27D26]/30 transition-all group">
                  <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <FileText className="text-[#F27D26]" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{t.guideTitle}</h3>
                  <p className="text-slate-500 text-sm mb-6">{t.guideDesc}</p>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 text-slate-400 mb-2" />
                      <p className="text-sm text-slate-500">
                        {guideFile ? guideFile.name : t.uploadPlaceholder}
                      </p>
                    </div>
                    <input type="file" className="hidden" accept=".pdf" onChange={(e) => setGuideFile(e.target.files?.[0] || null)} />
                  </label>
                </div>

                {/* Upload Questions */}
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:border-[#F27D26]/30 transition-all group">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <BookOpen className="text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{t.bankTitle}</h3>
                  <p className="text-slate-500 text-sm mb-6">{t.bankDesc}</p>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 text-slate-400 mb-2" />
                      <p className="text-sm text-slate-500">
                        {bankFile ? bankFile.name : t.uploadPlaceholder}
                      </p>
                    </div>
                    <input type="file" className="hidden" accept=".pdf" onChange={(e) => setBankFile(e.target.files?.[0] || null)} />
                  </label>
                </div>
              </div>

              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-slate-700">{t.langLabel}</span>
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                      <button
                        onClick={() => setLanguage("pt")}
                        className={`px-4 py-2 rounded-md font-bold text-xs transition-all ${
                          language === "pt" 
                            ? "bg-white text-[#F27D26] shadow-sm" 
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        Português
                      </button>
                      <button
                        onClick={() => setLanguage("en")}
                        className={`px-4 py-2 rounded-md font-bold text-xs transition-all ${
                          language === "en" 
                            ? "bg-white text-[#F27D26] shadow-sm" 
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        English
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-slate-700">{t.questionCountLabel}</span>
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                      {[10, 30, 60].map((count) => (
                        <button
                          key={count}
                          onClick={() => setQuestionCount(count)}
                          className={`px-6 py-2 rounded-md font-bold text-sm transition-all ${
                            questionCount === count 
                              ? "bg-white text-[#F27D26] shadow-sm" 
                              : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          {count}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  disabled={!guideFile || !bankFile}
                  onClick={handleGenerateSimulation}
                  className="w-full md:w-auto bg-[#F27D26] text-white px-10 py-4 rounded-xl font-bold text-lg shadow-lg shadow-orange-200 hover:bg-[#d96d1d] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  <Play size={20} fill="currentColor" />
                  {t.generateBtn}
                </button>
              </div>
            </motion.div>
          )}

          {state === "LOADING" && (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32 space-y-6"
            >
              <div className="relative">
                <Loader2 className="w-16 h-16 text-[#F27D26] animate-spin" />
                <Cloud className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#F27D26] w-6 h-6" />
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-[#0F172A]">{loadingMessage}</h3>
                <p className="text-slate-500">{t.loadingDesc}</p>
              </div>
            </motion.div>
          )}

          {state === "WELCOME" && (
            <motion.div 
              key="welcome"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl mx-auto py-12"
            >
              <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-xl space-y-8">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-50 text-green-600 rounded-full mb-4">
                    <CheckCircle2 size={32} />
                  </div>
                  <h2 className="text-3xl font-bold text-[#0F172A]">{t.readyTitle}</h2>
                  <p className="text-slate-500">{t.readyDesc}</p>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl space-y-4">
                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    <AlertCircle size={18} className="text-[#F27D26]" />
                    {t.rulesTitle}
                  </h4>
                  <ul className="space-y-3 text-sm text-slate-600">
                    <li className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 bg-[#F27D26] rounded-full" />
                      <Markdown>{t.ruleQuestions(questionCount)}</Markdown>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 bg-[#F27D26] rounded-full" />
                      <Markdown>{t.ruleTime(questionCount)}</Markdown>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 bg-[#F27D26] rounded-full" />
                      <Markdown>{t.ruleFlag}</Markdown>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 bg-[#F27D26] rounded-full" />
                      <span>{t.ruleTimeout}</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={startSimulation}
                  className="w-full bg-[#0F172A] text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-all shadow-lg"
                >
                  {t.startBtn}
                </button>
              </div>
            </motion.div>
          )}

          {state === "SIMULATING" && simulationQuestions.length > 0 && (
            <motion.div 
              key="simulating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid lg:grid-cols-[1fr_300px] gap-8 py-8"
            >
              {/* Question Area */}
              <div className="space-y-6">
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm min-h-[400px] flex flex-col">
                  <div className="flex items-center justify-between mb-8">
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                      {t.questionLabel(currentQuestionIndex + 1, simulationQuestions.length)}
                    </span>
                    <button 
                      onClick={() => setMarkedForReview(prev => ({ ...prev, [simulationQuestions[currentQuestionIndex].id]: !prev[simulationQuestions[currentQuestionIndex].id] }))}
                      className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                        markedForReview[simulationQuestions[currentQuestionIndex].id] 
                          ? "bg-orange-100 text-[#F27D26]" 
                          : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                      }`}
                    >
                      <Flag size={14} fill={markedForReview[simulationQuestions[currentQuestionIndex].id] ? "currentColor" : "none"} />
                      {markedForReview[simulationQuestions[currentQuestionIndex].id] ? t.markedReview : t.markReview}
                    </button>
                    <button 
                      onClick={handleTranslateCurrentQuestion}
                      disabled={isTranslating}
                      className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all disabled:opacity-50"
                    >
                      {isTranslating ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <BookOpen size={14} />
                      )}
                      {isTranslating ? t.translating : t.translateBtn}
                    </button>
                  </div>

                  <h3 className="text-xl font-medium text-[#0F172A] leading-relaxed mb-8">
                    {simulationQuestions[currentQuestionIndex].text}
                  </h3>

                  <div className="space-y-3 mt-auto">
                    {simulationQuestions[currentQuestionIndex].options.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setUserAnswers(prev => ({ ...prev, [simulationQuestions[currentQuestionIndex].id]: option.id }))}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                          userAnswers[simulationQuestions[currentQuestionIndex].id] === option.id
                            ? "border-[#F27D26] bg-orange-50/50"
                            : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                          userAnswers[simulationQuestions[currentQuestionIndex].id] === option.id
                            ? "bg-[#F27D26] text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}>
                          {option.id}
                        </div>
                        <span className="text-slate-700 font-medium">{option.text}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-all"
                  >
                    <ChevronLeft size={20} />
                    {t.prevBtn}
                  </button>
                  <div className="flex gap-2">
                    {currentQuestionIndex === simulationQuestions.length - 1 ? (
                      <button
                        onClick={finishSimulation}
                        className="bg-[#F27D26] text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-orange-100 hover:bg-[#d96d1d] transition-all"
                      >
                        {t.finishBtn}
                      </button>
                    ) : (
                      <button
                        onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                        className="flex items-center gap-2 bg-[#0F172A] text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all"
                      >
                        {t.nextBtn}
                        <ChevronRight size={20} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar Progress */}
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <BarChart3 size={18} className="text-[#F27D26]" />
                    {t.progressTitle}
                  </h4>
                  <div className="grid grid-cols-5 gap-2">
                    {simulationQuestions.map((q, idx) => {
                      const isAnswered = !!userAnswers[q.id];
                      const isMarked = !!markedForReview[q.id];
                      const isCurrent = currentQuestionIndex === idx;
                      
                      return (
                        <button
                          key={q.id}
                          onClick={() => setCurrentQuestionIndex(idx)}
                          className={`aspect-square rounded-lg text-[10px] font-bold flex items-center justify-center transition-all border-2 ${
                            isCurrent ? "border-[#F27D26] scale-110 z-10" : "border-transparent"
                          } ${
                            isMarked 
                              ? "bg-orange-100 text-[#F27D26]" 
                              : isAnswered 
                                ? "bg-slate-800 text-white" 
                                : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="mt-6 space-y-2 pt-6 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 flex items-center gap-2">
                        <div className="w-2 h-2 bg-slate-800 rounded-full" /> {t.answered}
                      </span>
                      <span className="font-bold">{Object.keys(userAnswers).length}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-100 rounded-full" /> {t.forReview}
                      </span>
                      <span className="font-bold">{Object.keys(markedForReview).filter(k => markedForReview[k]).length}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 flex items-center gap-2">
                        <div className="w-2 h-2 bg-slate-100 rounded-full" /> {t.pending}
                      </span>
                      <span className="font-bold">{simulationQuestions.length - Object.keys(userAnswers).length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {state === "COLLECTING_INFO" && (
            <motion.div 
              key="collecting"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-xl mx-auto py-12"
            >
              <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-xl space-y-8">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 text-blue-600 rounded-full mb-4">
                    <FileText size={32} />
                  </div>
                  <h2 className="text-3xl font-bold text-[#0F172A]">{t.collectInfoTitle}</h2>
                  <p className="text-slate-500">{t.collectInfoDesc}</p>
                </div>

                <form onSubmit={handleSubmitCandidateInfo} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">{t.nameLabel}</label>
                    <input 
                      required
                      type="text"
                      value={candidateName}
                      onChange={(e) => setCandidateName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#F27D26] focus:ring-2 focus:ring-[#F27D26]/20 outline-none transition-all"
                      placeholder="Ex: João Silva"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">{t.ageLabel}</label>
                    <input 
                      required
                      type="number"
                      value={candidateAge}
                      onChange={(e) => setCandidateAge(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#F27D26] focus:ring-2 focus:ring-[#F27D26]/20 outline-none transition-all"
                      placeholder="Ex: 28"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-[#F27D26] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#d96d1d] transition-all shadow-lg shadow-orange-100"
                  >
                    {t.submitResultsBtn}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {state === "RESULTS" && result && (
            <motion.div 
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8 py-8"
              ref={reportRef}
            >
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center space-y-2">
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{t.scoreLabel}</p>
                  <div className={`text-5xl font-black ${result.score >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.round(result.score)}%
                  </div>
                  <p className="text-slate-400 text-sm">{result.score >= 70 ? t.scorePass : t.scoreFail}</p>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center space-y-2">
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{t.timeLabel}</p>
                  <div className="text-5xl font-black text-[#0F172A]">
                    {formatTime(result.timeUsed)}
                  </div>
                  <p className="text-slate-400 text-sm">{t.timeAvg(Math.round(result.timeUsed / result.totalQuestions))}</p>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center space-y-2">
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{t.questionsLabel}</p>
                  <div className="text-5xl font-black text-[#0F172A]">
                    {result.answers.filter(a => a.isCorrect).length}/{result.totalQuestions}
                  </div>
                  <p className="text-slate-400 text-sm">{t.questionsTotal}</p>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-[#0F172A] p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Cloud size={24} className="text-[#F27D26]" />
                    <div>
                      <h3 className="text-white font-bold">{t.aiAnalysisTitle}</h3>
                      <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                        {t.candidateNameLabel} {result.candidateName} | {t.candidateAgeLabel} {result.candidateAge} | {t.evaluationDateLabel} {new Date().toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US')}
                      </p>
                    </div>
                  </div>
                  {isAnalyzing && (
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <Loader2 size={16} className="animate-spin" />
                      {t.aiGenerating}
                    </div>
                  )}
                </div>
                <div className="p-8 prose prose-slate max-w-none">
                  {isAnalyzing ? (
                    <div className="space-y-4 animate-pulse">
                      <div className="h-4 bg-slate-100 rounded w-3/4" />
                      <div className="h-4 bg-slate-100 rounded w-1/2" />
                      <div className="h-4 bg-slate-100 rounded w-5/6" />
                      <div className="h-32 bg-slate-50 rounded w-full" />
                    </div>
                  ) : (
                    <div className="markdown-body">
                      <Markdown>{aiAnalysis}</Markdown>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-8">
                <button
                  onClick={() => setState("IDLE")}
                  className="w-full md:w-auto bg-slate-100 text-slate-600 px-10 py-4 rounded-xl font-bold hover:bg-slate-200 transition-all"
                >
                  {t.newSimBtn}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Translation Modal */}
        <AnimatePresence>
          {translatedQuestion && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              >
                <div className="bg-blue-600 p-6 flex items-center justify-between text-white">
                  <div className="flex items-center gap-3">
                    <BookOpen size={24} />
                    <h3 className="text-xl font-bold">{t.translateBtn}</h3>
                  </div>
                  <button 
                    onClick={() => setTranslatedQuestion(null)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <XCircle size={24} />
                  </button>
                </div>
                
                <div className="p-8 overflow-y-auto space-y-8">
                  <div className="space-y-4">
                    <span className="text-xs font-black uppercase tracking-widest text-blue-600">Questão Traduzida</span>
                    <h4 className="text-xl font-medium text-slate-800 leading-relaxed">
                      {translatedQuestion.text}
                    </h4>
                  </div>

                  <div className="space-y-3">
                    {translatedQuestion.options.map((option) => (
                      <div
                        key={option.id}
                        className="w-full p-4 rounded-xl border-2 border-slate-100 flex items-center gap-4"
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm bg-slate-100 text-slate-500">
                          {option.id}
                        </div>
                        <span className="text-slate-700 font-medium">{option.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-center">
                  <button
                    onClick={() => setTranslatedQuestion(null)}
                    className="bg-blue-600 text-white px-10 py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg"
                  >
                    {t.backBtn}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="max-w-5xl mx-auto p-6 text-center text-slate-400 text-xs border-t border-slate-100 mt-12">
        &copy; {new Date().getFullYear()} CertaCloud - {t.footer}
      </footer>
    </div>
  );
}
