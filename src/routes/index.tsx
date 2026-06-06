import { createFileRoute, Link } from "@tanstack/react-router";
import { SssFooter } from "@/components/SssHeader";
import { 
  FileText, CreditCard, Download, BookOpen, HelpCircle, 
  Video, CheckSquare, Briefcase, Book,
  Lock, BarChart, Edit, Key
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingHeader() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-white shadow-sm border-[2px] border-white">
            <img src="/sss_logo.png" alt="SSS Logo" className="w-full h-full object-cover object-center scale-[1.05]" />
          </div>
          <div className="flex flex-col">
            <span className="text-[#1a365d] font-bold text-lg leading-tight">Social Security System</span>
            <span className="text-[#e09f3e] text-xs font-bold uppercase tracking-wider">Member Portal</span>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-6 text-sm font-bold text-[#1a365d]">
          <a href="#" className="hover:text-[#e09f3e] transition-colors">SSS Home</a>
          <a href="#" className="hover:text-[#e09f3e] transition-colors">Issuances & Rulings</a>
          <a href="#" className="hover:text-[#e09f3e] transition-colors">FAQs</a>
          <a href="#" className="hover:text-[#e09f3e] transition-colors">Job Aids</a>
          <a href="#" className="hover:text-[#e09f3e] transition-colors">Downloads</a>
          <Link 
            to="/auth" 
            className="bg-[#e09f3e] text-[#1a365d] px-5 py-2 rounded font-bold hover:bg-[#c98e37] transition-colors shadow-sm ml-2"
          >
            Login / Register
          </Link>
        </div>
      </div>
      {/* Yellow separator line like in the image */}
      <div className="h-1 bg-[#e09f3e] w-full"></div>
    </header>
  );
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f4f6f9] flex flex-col font-sans">
      <LandingHeader />
      
      {/* Hero Section */}
      <div className="relative bg-[#1a365d] text-white py-24 px-4 overflow-hidden">
        {/* Background Image Overlay */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center opacity-30 mix-blend-overlay"
          style={{ backgroundImage: "url('/sss_bg.png')" }}
        ></div>
        
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="inline-block px-3 py-1 border border-[#e09f3e] rounded-full text-[#e09f3e] text-xs font-bold mb-6 tracking-wider bg-[#e09f3e]/10">
            <span className="mr-2 inline-block w-2 h-2 rounded-full bg-[#e09f3e]"></span>
            OFFICIAL SSS PORTAL
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            Social Security <span className="text-[#e09f3e] italic font-serif">System</span>
          </h1>
          <p className="text-lg text-white/80 max-w-xl leading-relaxed">
            Manage your SSS contributions, apply for loans, and view benefits securely online using your registered account.
          </p>
        </div>
      </div>
      
      {/* Yellow bottom border for hero */}
      <div className="h-1 bg-[#e09f3e] w-full"></div>

      {/* Quick Action Strip */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 divide-x divide-gray-100">
            {[
              { icon: FileText, label: "View Contributions", color: "text-blue-500", bg: "bg-blue-50" },
              { icon: CreditCard, label: "Apply for Loan", color: "text-orange-500", bg: "bg-orange-50" },
              { icon: Download, label: "Generate PRN", color: "text-green-500", bg: "bg-green-50" },
              { icon: BookOpen, label: "Claim Benefits", color: "text-purple-500", bg: "bg-purple-50" },
              { icon: HelpCircle, label: "Help & FAQs", color: "text-red-500", bg: "bg-red-50" },
            ].map((action, i) => (
              <div key={i} className="flex flex-col items-center justify-center p-4 hover:bg-gray-50 cursor-pointer transition-colors text-center group rounded-lg md:rounded-none">
                <div className={`w-10 h-10 ${action.bg} ${action.color} rounded flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-[#1a365d]">{action.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-12 w-full">
        {/* Tabs */}
        <div className="flex flex-wrap gap-6 border-b border-gray-200 mb-8 pb-3">
          <button className="flex items-center gap-2 font-bold text-[#1a365d] border-b-2 border-[#1a365d] pb-3 -mb-[14px]">
            <FileText className="w-4 h-4 text-[#e09f3e]" />
            Step-by-Step Guides
          </button>
          <button className="flex items-center gap-2 font-bold text-gray-500 hover:text-[#1a365d] pb-3 -mb-[14px]">
            <Video className="w-4 h-4 text-purple-700" />
            Video Tutorials
          </button>
          <button className="flex items-center gap-2 font-bold text-gray-500 hover:text-[#1a365d] pb-3 -mb-[14px]">
            <CheckSquare className="w-4 h-4 text-green-500" />
            Compliance Checklists
          </button>
          <button className="flex items-center gap-2 font-bold text-gray-500 hover:text-[#1a365d] pb-3 -mb-[14px]">
            <Briefcase className="w-4 h-4 text-yellow-500" />
            SSS Job Aids
          </button>
          <button className="flex items-center gap-2 font-bold text-gray-500 hover:text-[#1a365d] pb-3 -mb-[14px]">
            <Book className="w-4 h-4 text-blue-400" />
            Glossary
          </button>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card 1 */}
          <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden flex flex-col">
            <div className="bg-[#1a365d] p-5 flex gap-4 text-white">
              <div className="bg-white/10 p-3 rounded flex-shrink-0">
                <Lock className="w-6 h-6 text-[#e09f3e]" />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight mb-1">How to Enroll in Portal</h3>
                <p className="text-xs text-white/70">Beginner • 5 minutes</p>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <ul className="space-y-3 mb-6 flex-1">
                {[
                  "Visit the SSS Portal login page and click 'Register'",
                  "Enter your CRN/SS Number, name, and email address",
                  "Create a strong password (min. 8 characters)",
                  "Agree to the Terms & Conditions",
                  "Submit and await verification (1-2 days)",
                  "Activate your account via email link"
                ].map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-700">
                    <span className="flex-shrink-0 w-5 h-5 bg-[#1a365d] text-white rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5">
                      {i + 1}
                    </span>
                    <span className="leading-snug">{step}</span>
                  </li>
                ))}
              </ul>
              <button className="w-full py-2.5 border border-gray-300 rounded font-bold text-sm text-[#1a365d] hover:bg-gray-50 transition-colors flex items-center justify-between px-4">
                Download PDF Guide <span>→</span>
              </button>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden flex flex-col">
            <div className="bg-[#1a365d] p-5 flex gap-4 text-white">
              <div className="bg-white/10 p-3 rounded flex-shrink-0">
                <FileText className="w-6 h-6 text-blue-300" />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight mb-1">Applying for a Salary Loan</h3>
                <p className="text-xs text-white/70">Intermediate • 8 minutes</p>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <ul className="space-y-3 mb-6 flex-1">
                {[
                  "Log in to your SSS account",
                  "Navigate to 'E-Services > Loans' from the dashboard",
                  "Select 'Apply for Salary Loan'",
                  "Choose loan amount and disbursement account",
                  "Review your employer details and loan terms",
                  "Submit application and save the Transaction Number"
                ].map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-700">
                    <span className="flex-shrink-0 w-5 h-5 bg-[#1a365d] text-white rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5">
                      {i + 1}
                    </span>
                    <span className="leading-snug">{step}</span>
                  </li>
                ))}
              </ul>
              <button className="w-full py-2.5 border border-gray-300 rounded font-bold text-sm text-[#1a365d] hover:bg-gray-50 transition-colors flex items-center justify-between px-4">
                Download PDF Guide <span>→</span>
              </button>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden flex flex-col">
            <div className="bg-[#1a365d] p-5 flex gap-4 text-white">
              <div className="bg-white/10 p-3 rounded flex-shrink-0">
                <CreditCard className="w-6 h-6 text-green-300" />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight mb-1">Generating PRN for Payment</h3>
                <p className="text-xs text-white/70">Intermediate • 6 minutes</p>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <ul className="space-y-3 mb-6 flex-1">
                {[
                  "Log in and navigate to 'Payment Reference Number (PRN)'",
                  "Click 'Generate PRN' from the menu",
                  "Select the applicable month(s) and contribution amount",
                  "Verify your membership type and details",
                  "Generate the PRN and print or save the statement",
                  "Pay via accredited collecting partners or mobile apps"
                ].map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-700">
                    <span className="flex-shrink-0 w-5 h-5 bg-[#1a365d] text-white rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5">
                      {i + 1}
                    </span>
                    <span className="leading-snug">{step}</span>
                  </li>
                ))}
              </ul>
              <button className="w-full py-2.5 border border-gray-300 rounded font-bold text-sm text-[#1a365d] hover:bg-gray-50 transition-colors flex items-center justify-between px-4">
                Download PDF Guide <span>→</span>
              </button>
            </div>
          </div>

          {/* Bottom row cards to match image grid feeling */}
          {/* Card 4 */}
          <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden flex flex-col h-full">
            <div className="bg-[#1a365d] p-5 flex gap-4 text-white">
              <div className="bg-white/10 p-3 rounded flex-shrink-0">
                <BarChart className="w-6 h-6 text-pink-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight mb-1">Viewing Contributions</h3>
                <p className="text-xs text-white/70">Beginner • 2 minutes</p>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-end">
              <button className="w-full py-2.5 border border-gray-300 rounded font-bold text-sm text-[#1a365d] hover:bg-gray-50 transition-colors flex items-center justify-between px-4 mt-auto">
                Download PDF Guide <span>→</span>
              </button>
            </div>
          </div>

          {/* Card 5 */}
          <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden flex flex-col h-full">
            <div className="bg-[#1a365d] p-5 flex gap-4 text-white">
              <div className="bg-white/10 p-3 rounded flex-shrink-0">
                <Edit className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight mb-1">Updating Member Data</h3>
                <p className="text-xs text-white/70">Advanced • 15 minutes</p>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-end">
              <button className="w-full py-2.5 border border-gray-300 rounded font-bold text-sm text-[#1a365d] hover:bg-gray-50 transition-colors flex items-center justify-between px-4 mt-auto">
                Download PDF Guide <span>→</span>
              </button>
            </div>
          </div>

          {/* Card 6 */}
          <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden flex flex-col h-full">
            <div className="bg-[#1a365d] p-5 flex gap-4 text-white">
              <div className="bg-white/10 p-3 rounded flex-shrink-0">
                <Key className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight mb-1">Password Reset & Recovery</h3>
                <p className="text-xs text-white/70">Beginner • 3 minutes</p>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-end">
              <button className="w-full py-2.5 border border-gray-300 rounded font-bold text-sm text-[#1a365d] hover:bg-gray-50 transition-colors flex items-center justify-between px-4 mt-auto">
                Download PDF Guide <span>→</span>
              </button>
            </div>
          </div>

        </div>
      </main>

      <SssFooter />
    </div>
  );
}
