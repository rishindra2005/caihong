export function analyzeLatexCompilation(logContents: string, pdfExists: boolean) {
  const errorRegex = /^!(.+)$/gm;
  const fatalErrorRegex = /Fatal error occurred/i;
  const outputWrittenRegex = /Output written on .+\.pdf/i;
  const warningRegex = /LaTeX Warning:(.+?)$/gm;
  const badBoxRegex = /(Overfull|Underfull)\\(h|v)box(.+?)$/gm;
  const rerunWarningRegex = /(LaTeX Warning: Label\(s\) may have changed|Please rerun LaTeX)/gm;
  
  let errors: string[] = [];
  let warnings: string[] = [];
  let badBoxes: string[] = [];
  let match;
  
  // Extract errors
  while ((match = errorRegex.exec(logContents)) !== null) {
    errors.push(match[1].trim());
  }
  
  // Extract warnings
  while ((match = warningRegex.exec(logContents)) !== null) {
    warnings.push(match[1].trim());
  }
  
  // Extract bad boxes
  while ((match = badBoxRegex.exec(logContents)) !== null) {
    badBoxes.push(match[0].trim());
  }
  
  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;
  const hasBadBoxes = badBoxes.length > 0;
  const hasFatalErrors = fatalErrorRegex.test(logContents);
  const outputConfirmed = outputWrittenRegex.test(logContents);
  const needsRerun = rerunWarningRegex.test(logContents);
  
  // Count pages if possible
  const pageCountRegex = /Output written on .+ \((\d+) pages?/;
  let pageCount = 0;
  match = pageCountRegex.exec(logContents);
  if (match) {
    pageCount = parseInt(match[1], 10);
  }
  
  // Extract LaTeX compiler version
  const compilerVersionRegex = /This is (pdfTeX|XeTeX|LuaTeX|TeX).+Version (.+)$/m;
  let compilerInfo = '';
  match = compilerVersionRegex.exec(logContents);
  if (match) {
    compilerInfo = `${match[1]} ${match[2]}`;
  }
  
  // Extract total compilation time
  const compilationTimeRegex = /Output written.+\((\d+\.\d+) seconds\)/;
  let compilationTime = 0;
  match = compilationTimeRegex.exec(logContents);
  if (match) {
    compilationTime = parseFloat(match[1]);
  }
  
  // Determine compilation status
  if (!hasErrors && (pdfExists || outputConfirmed)) {
    return {
      status: 'success',
      statusText: hasWarnings || hasBadBoxes 
        ? `Compiled successfully with ${warnings.length} warning${warnings.length === 1 ? '' : 's'} and ${badBoxes.length} bad box${badBoxes.length === 1 ? '' : 'es'}` 
        : 'Compiled successfully',
      hasErrors: false,
      hasWarnings,
      hasBadBoxes,
      hasFatalErrors: false,
      needsRerun,
      pdfGenerated: true,
      pageCount,
      errors,
      warnings,
      badBoxes,
      compilerInfo,
      compilationTime
    };
  } else if (hasErrors && (pdfExists || outputConfirmed)) {
    return {
      status: 'partial',
      statusText: `Compiled with ${errors.length} error${errors.length === 1 ? '' : 's'}, ${warnings.length} warning${warnings.length === 1 ? '' : 's'}`,
      hasErrors: true,
      hasWarnings,
      hasBadBoxes,
      hasFatalErrors: false,
      needsRerun,
      pdfGenerated: true,
      pageCount,
      errors,
      warnings,
      badBoxes,
      compilerInfo,
      compilationTime
    };
  } else {
    return {
      status: 'failure',
      statusText: hasFatalErrors ? 'Fatal error occurred' : 'Failed to compile',
      hasErrors: true,
      hasWarnings,
      hasBadBoxes,
      hasFatalErrors: hasFatalErrors,
      needsRerun: false,
      pdfGenerated: false,
      pageCount: 0,
      errors,
      warnings,
      badBoxes,
      compilerInfo,
      compilationTime
    };
  }
}

// Function to parse raw LaTeX logs into a structured format
export function parseLatexLogs(rawLogs: string): ParsedLatexLog {
  const analysis = analyzeLatexCompilation(rawLogs, false);
  
  // Split logs into lines for easier processing
  const lines = rawLogs.split('\n');
  
  // Extract file references from errors
  const fileRefRegex = /([^:(]+\.[^:)]+):(\d+)(?:-(\d+))?/g;
  const fileReferences: FileReference[] = [];
  let match;
  
  const combinedText = [...analysis.errors, ...analysis.warnings, rawLogs].join('\n');
  
  while ((match = fileRefRegex.exec(combinedText)) !== null) {
    fileReferences.push({
      file: match[1].trim(),
      line: parseInt(match[2], 10),
      endLine: match[3] ? parseInt(match[3], 10) : parseInt(match[2], 10)
    });
  }
  
  // Ensure status is properly typed
  const status = analysis.status as 'success' | 'partial' | 'failure';
  
  return {
    ...analysis,
    status,
    fileReferences,
    rawLogs: lines
  };
}

// Interface for structured LaTeX log data
export interface ParsedLatexLog {
  status: 'success' | 'partial' | 'failure';
  statusText: string;
  hasErrors: boolean;
  hasWarnings: boolean;
  hasBadBoxes: boolean;
  hasFatalErrors: boolean;
  needsRerun: boolean;
  pdfGenerated: boolean;
  pageCount: number;
  errors: string[];
  warnings: string[];
  badBoxes: string[];
  fileReferences: FileReference[];
  rawLogs: string[];
  compilerInfo: string;
  compilationTime: number;
}

// Interface for file references in errors/warnings
export interface FileReference {
  file: string;
  line: number;
  endLine: number;
} 