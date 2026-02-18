// Audit scoring calculator with 96/100 minimum and 90/100 functionality ceiling

function calculateAuditScore(checks) {
  // Functionality checks (40% weight)
  const functionalityIssues = [];
  let functionalityScore = 40;
  
  // Critical functionality deductions
  if (checks.api404 > 0) {
    functionalityScore -= 20 * checks.api404;
    functionalityIssues.push(`${checks.api404} API endpoint(s) returning 404`);
  }
  if (checks.page404 > 0) {
    functionalityScore -= 20 * checks.page404;
    functionalityIssues.push(`${checks.page404} page(s) returning 404`);
  }
  if (checks.featureBroken > 0) {
    functionalityScore -= 15 * checks.featureBroken;
    functionalityIssues.push(`${checks.featureBroken} feature(s) non-functional`);
  }
  if (checks.dataNotLoading) {
    functionalityScore -= 10;
    functionalityIssues.push('Data not loading');
  }
  if (checks.navigationBroken) {
    functionalityScore -= 10;
    functionalityIssues.push('Navigation broken');
  }
  if (checks.mobileIssues) {
    functionalityScore -= 5;
    functionalityIssues.push('Mobile responsive issues');
  }
  
  // Floor at 0
  functionalityScore = Math.max(0, functionalityScore);
  
  // Apply functionality ceiling
  const hasCriticalIssue = functionalityScore < 40;
  const maxPossibleScore = hasCriticalIssue ? 90 : 100;
  
  // Other categories (only calculate if functionality is acceptable)
  let codeQualityScore = hasCriticalIssue ? 0 : (checks.codeQuality || 23); // 25 max
  let testingScore = hasCriticalIssue ? 0 : (checks.testing || 13); // 15 max
  let documentationScore = hasCriticalIssue ? 0 : (checks.documentation || 8); // 10 max
  let deploymentScore = hasCriticalIssue ? 0 : (checks.deployment || 9); // 10 max
  
  // Calculate total
  let totalScore = Math.round(
    functionalityScore + 
    codeQualityScore + 
    testingScore + 
    documentationScore + 
    deploymentScore
  );
  
  // Apply ceiling
  totalScore = Math.min(totalScore, maxPossibleScore);
  
  // Determine status
  let status, emoji;
  if (totalScore >= 96) {
    status = 'EXCELLENT';
    emoji = '✅';
  } else if (totalScore >= 90) {
    status = 'CONDITIONAL PASS';
    emoji = '⚠️';
  } else if (totalScore >= 80) {
    status = 'NEEDS WORK';
    emoji = '🔧';
  } else {
    status = 'FAIL';
    emoji = '❌';
  }
  
  return {
    totalScore,
    maxPossibleScore,
    status,
    emoji,
    breakdown: {
      functionality: functionalityScore,
      codeQuality: codeQualityScore,
      testing: testingScore,
      documentation: documentationScore,
      deployment: deploymentScore
    },
    issues: functionalityIssues,
    canDeploy: totalScore >= 96,
    requiresFixes: totalScore < 90
  };
}

// Example usage:
// const result = calculateAuditScore({
//   api404: 1,           // /api/stats 404
//   page404: 0,
//   featureBroken: 0,
//   dataNotLoading: false,
//   navigationBroken: false,
//   mobileIssues: false,
//   codeQuality: 23,
//   testing: 13,
//   documentation: 8,
//   deployment: 9
// });
// Result: 90/100 max (functionality ceiling applied)

module.exports = { calculateAuditScore };
