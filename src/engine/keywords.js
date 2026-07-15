/**
 * @fileoverview Complete keyword database for AI Resume Analyzer.
 * Contains role-specific keywords sourced from real job postings,
 * organized by category for accurate ATS scoring.
 * @module engine/keywords
 */

/**
 * @typedef {Object} RoleKeywords
 * @property {string} title - Display name for the role
 * @property {string} slug - URL-friendly identifier
 * @property {string[]} core_skills - Fundamental technical skills
 * @property {string[]} tools - Specific tools and software
 * @property {string[]} practices - Methodologies and practices
 * @property {string[]} cloud_services - Cloud platform services
 * @property {string[]} certifications - Relevant certifications
 */

/**
 * Complete keyword database organized by role.
 * Each role contains 40-60 keywords across 5 categories.
 * @type {Object.<string, RoleKeywords>}
 */
export const ROLE_KEYWORDS = {
  'aws-devops': {
    title: 'AWS + DevOps Engineer',
    slug: 'aws-devops',
    core_skills: [
      'CI/CD', 'Infrastructure as Code', 'containerization', 'automation',
      'cloud architecture', 'scripting', 'monitoring', 'logging',
      'configuration management', 'networking', 'security', 'load balancing',
      'auto scaling', 'high availability', 'disaster recovery', 'microservices',
      'serverless', 'REST APIs', 'Linux', 'shell scripting'
    ],
    tools: [
      'Terraform', 'Ansible', 'Jenkins', 'Docker', 'Kubernetes',
      'GitHub Actions', 'GitLab CI', 'Helm', 'Prometheus', 'Grafana',
      'ELK Stack', 'ArgoCD', 'Vault', 'Packer', 'CloudFormation',
      'Datadog', 'New Relic', 'SonarQube', 'Nexus', 'Git'
    ],
    practices: [
      'GitOps', 'DevSecOps', 'agile', 'scrum', 'infrastructure automation',
      'blue-green deployment', 'canary deployment', 'rolling updates',
      'immutable infrastructure', 'shift-left testing', 'chaos engineering',
      'incident management', 'post-mortem', 'capacity planning'
    ],
    cloud_services: [
      'EC2', 'S3', 'RDS', 'Lambda', 'ECS', 'EKS', 'CloudWatch',
      'IAM', 'VPC', 'Route 53', 'CloudFront', 'ELB', 'ALB',
      'CodePipeline', 'CodeBuild', 'CodeDeploy', 'SNS', 'SQS',
      'DynamoDB', 'ElastiCache', 'Secrets Manager', 'Systems Manager'
    ],
    certifications: [
      'AWS Certified DevOps Engineer Professional',
      'AWS Certified Solutions Architect Associate',
      'AWS Certified SysOps Administrator',
      'Certified Kubernetes Administrator (CKA)',
      'HashiCorp Certified Terraform Associate',
      'Docker Certified Associate'
    ]
  },

  'aws-cloud-engineer': {
    title: 'AWS Cloud Engineer',
    slug: 'aws-cloud-engineer',
    core_skills: [
      'cloud migration', 'cloud architecture', 'networking', 'security',
      'automation', 'scripting', 'cost optimization', 'high availability',
      'disaster recovery', 'performance tuning', 'troubleshooting',
      'system administration', 'database management', 'Linux', 'Windows Server',
      'load balancing', 'DNS management', 'storage management', 'backup solutions'
    ],
    tools: [
      'CloudFormation', 'Terraform', 'Ansible', 'Python', 'Bash',
      'PowerShell', 'AWS CLI', 'CloudWatch', 'Datadog', 'Splunk',
      'Git', 'Jenkins', 'Docker', 'Kubernetes', 'Packer',
      'AWS CDK', 'Boto3', 'Serverless Framework'
    ],
    practices: [
      'Well-Architected Framework', 'cloud governance', 'cost management',
      'tagging strategy', 'multi-account strategy', 'landing zone',
      'network segmentation', 'encryption at rest', 'encryption in transit',
      'least privilege', 'compliance', 'SOC 2', 'HIPAA', 'PCI-DSS'
    ],
    cloud_services: [
      'EC2', 'S3', 'RDS', 'Aurora', 'DynamoDB', 'Lambda', 'ECS', 'EKS',
      'VPC', 'Direct Connect', 'Transit Gateway', 'CloudFront', 'Route 53',
      'IAM', 'KMS', 'Secrets Manager', 'CloudTrail', 'Config', 'GuardDuty',
      'Organizations', 'Control Tower', 'Service Catalog', 'CloudWatch',
      'SNS', 'SQS', 'Step Functions', 'API Gateway', 'ELB', 'ALB', 'NLB'
    ],
    certifications: [
      'AWS Certified Solutions Architect Associate',
      'AWS Certified Solutions Architect Professional',
      'AWS Certified SysOps Administrator Associate',
      'AWS Certified Cloud Practitioner',
      'AWS Certified Advanced Networking Specialty',
      'HashiCorp Certified Terraform Associate'
    ]
  },

  'aws-solutions-architect': {
    title: 'AWS Solutions Architect',
    slug: 'aws-solutions-architect',
    core_skills: [
      'solution design', 'cloud architecture', 'system design', 'scalability',
      'high availability', 'fault tolerance', 'cost optimization', 'security architecture',
      'data modeling', 'API design', 'microservices architecture', 'event-driven architecture',
      'serverless architecture', 'hybrid cloud', 'multi-region', 'disaster recovery',
      'capacity planning', 'performance optimization', 'technical leadership'
    ],
    tools: [
      'CloudFormation', 'Terraform', 'AWS CDK', 'Lucidchart', 'Draw.io',
      'Python', 'Java', 'Node.js', 'AWS CLI', 'SAM',
      'Serverless Framework', 'Docker', 'Kubernetes'
    ],
    practices: [
      'Well-Architected Framework', 'twelve-factor app', 'TOGAF',
      'domain-driven design', 'event sourcing', 'CQRS', 'saga pattern',
      'circuit breaker', 'bulkhead pattern', 'strangler fig pattern',
      'cloud-native design', 'infrastructure as code', 'GitOps',
      'security by design', 'zero trust architecture'
    ],
    cloud_services: [
      'EC2', 'S3', 'RDS', 'Aurora', 'DynamoDB', 'Lambda', 'ECS', 'EKS',
      'API Gateway', 'AppSync', 'Step Functions', 'EventBridge', 'Kinesis',
      'SQS', 'SNS', 'VPC', 'CloudFront', 'Route 53', 'Global Accelerator',
      'Transit Gateway', 'Direct Connect', 'IAM', 'KMS', 'WAF', 'Shield',
      'Cognito', 'ElastiCache', 'Redshift', 'Athena', 'Glue', 'MSK',
      'SageMaker', 'Bedrock', 'EFS', 'FSx', 'Backup'
    ],
    certifications: [
      'AWS Certified Solutions Architect Professional',
      'AWS Certified Solutions Architect Associate',
      'AWS Certified Security Specialty',
      'AWS Certified Database Specialty',
      'AWS Certified Advanced Networking Specialty',
      'TOGAF Certified'
    ]
  },

  'devops-engineer': {
    title: 'DevOps Engineer',
    slug: 'devops-engineer',
    core_skills: [
      'CI/CD', 'automation', 'Infrastructure as Code', 'containerization',
      'orchestration', 'scripting', 'monitoring', 'logging', 'alerting',
      'configuration management', 'release management', 'version control',
      'cloud computing', 'networking', 'security', 'troubleshooting',
      'performance optimization', 'Linux administration', 'shell scripting'
    ],
    tools: [
      'Jenkins', 'GitLab CI', 'GitHub Actions', 'CircleCI', 'ArgoCD',
      'Docker', 'Kubernetes', 'Helm', 'Terraform', 'Ansible', 'Puppet',
      'Chef', 'Prometheus', 'Grafana', 'ELK Stack', 'Datadog', 'PagerDuty',
      'Vault', 'SonarQube', 'Artifactory', 'Nexus', 'Git', 'Nginx',
      'HAProxy', 'Redis', 'RabbitMQ', 'Kafka'
    ],
    practices: [
      'GitOps', 'DevSecOps', 'agile', 'scrum', 'kanban',
      'continuous integration', 'continuous delivery', 'continuous deployment',
      'blue-green deployment', 'canary releases', 'feature flags',
      'immutable infrastructure', 'infrastructure automation',
      'shift-left security', 'observability', 'SRE principles',
      'incident response', 'blameless post-mortems', 'toil reduction'
    ],
    cloud_services: [
      'AWS', 'Azure', 'GCP', 'EC2', 'S3', 'EKS', 'ECS', 'Lambda',
      'CloudWatch', 'IAM', 'VPC', 'AKS', 'GKE', 'Cloud Build',
      'Azure DevOps', 'CodePipeline', 'CodeBuild'
    ],
    certifications: [
      'AWS Certified DevOps Engineer Professional',
      'Certified Kubernetes Administrator (CKA)',
      'Certified Kubernetes Application Developer (CKAD)',
      'HashiCorp Certified Terraform Associate',
      'Docker Certified Associate',
      'Azure DevOps Engineer Expert',
      'Google Professional Cloud DevOps Engineer'
    ]
  },

  'sre': {
    title: 'Site Reliability Engineer (SRE)',
    slug: 'sre',
    core_skills: [
      'reliability engineering', 'system design', 'distributed systems',
      'capacity planning', 'performance engineering', 'incident management',
      'monitoring', 'observability', 'automation', 'scripting',
      'Linux internals', 'networking', 'load balancing', 'troubleshooting',
      'root cause analysis', 'chaos engineering', 'toil reduction',
      'on-call management', 'SLIs', 'SLOs', 'SLAs', 'error budgets'
    ],
    tools: [
      'Prometheus', 'Grafana', 'Datadog', 'PagerDuty', 'OpsGenie',
      'ELK Stack', 'Splunk', 'Jaeger', 'OpenTelemetry', 'Terraform',
      'Kubernetes', 'Docker', 'Ansible', 'Python', 'Go', 'Bash',
      'Nginx', 'Envoy', 'Istio', 'Consul', 'Vault', 'Kafka',
      'Redis', 'PostgreSQL', 'MySQL', 'MongoDB'
    ],
    practices: [
      'SRE principles', 'error budget policy', 'blameless post-mortems',
      'incident response', 'runbook automation', 'chaos engineering',
      'game days', 'progressive rollouts', 'canary analysis',
      'capacity planning', 'load testing', 'stress testing',
      'disaster recovery testing', 'on-call rotation',
      'service level objectives', 'golden signals', 'four golden signals',
      'observability-driven development'
    ],
    cloud_services: [
      'EC2', 'EKS', 'ECS', 'Lambda', 'CloudWatch', 'X-Ray',
      'Route 53', 'CloudFront', 'ALB', 'NLB', 'Auto Scaling',
      'S3', 'RDS', 'DynamoDB', 'ElastiCache', 'SQS', 'SNS',
      'GKE', 'Cloud Monitoring', 'AKS', 'Azure Monitor'
    ],
    certifications: [
      'Certified Kubernetes Administrator (CKA)',
      'AWS Certified DevOps Engineer Professional',
      'Google Professional Cloud DevOps Engineer',
      'AWS Certified SysOps Administrator',
      'Certified Kubernetes Security Specialist (CKS)',
      'Linux Foundation Certified System Administrator (LFCS)'
    ]
  },

  'linux-administrator': {
    title: 'Linux Administrator',
    slug: 'linux-administrator',
    core_skills: [
      'Linux administration', 'system administration', 'shell scripting',
      'networking', 'firewall configuration', 'security hardening',
      'user management', 'file system management', 'package management',
      'process management', 'performance tuning', 'log analysis',
      'backup and recovery', 'patch management', 'storage management',
      'virtualization', 'troubleshooting', 'automation', 'DNS', 'DHCP',
      'LDAP', 'NFS', 'SMTP', 'SSH', 'TCP/IP'
    ],
    tools: [
      'Bash', 'Python', 'Ansible', 'Puppet', 'Chef', 'Nagios',
      'Zabbix', 'Prometheus', 'Grafana', 'rsyslog', 'systemd',
      'iptables', 'firewalld', 'SELinux', 'AppArmor', 'LVM',
      'RAID', 'KVM', 'VMware', 'Vagrant', 'Docker', 'Git',
      'Apache', 'Nginx', 'HAProxy', 'Postfix', 'Samba',
      'OpenLDAP', 'FreeIPA', 'Kickstart', 'PXE'
    ],
    practices: [
      'system hardening', 'CIS benchmarks', 'patch management',
      'change management', 'incident management', 'capacity planning',
      'disaster recovery', 'high availability', 'clustering',
      'configuration management', 'documentation', 'ITIL',
      'compliance', 'audit logging', 'access control'
    ],
    cloud_services: [
      'EC2', 'AWS Systems Manager', 'AWS Patch Manager',
      'CloudWatch Agent', 'S3', 'EFS', 'EBS', 'VPC',
      'IAM', 'Azure VMs', 'GCP Compute Engine'
    ],
    certifications: [
      'RHCSA (Red Hat Certified System Administrator)',
      'RHCE (Red Hat Certified Engineer)',
      'LPIC-1', 'LPIC-2', 'LPIC-3',
      'CompTIA Linux+',
      'Linux Foundation Certified System Administrator (LFCS)',
      'Linux Foundation Certified Engineer (LFCE)',
      'AWS Certified SysOps Administrator'
    ]
  },

  'cloud-security-engineer': {
    title: 'Cloud Security Engineer',
    slug: 'cloud-security-engineer',
    core_skills: [
      'cloud security', 'identity and access management', 'encryption',
      'network security', 'vulnerability management', 'threat modeling',
      'security architecture', 'incident response', 'compliance',
      'penetration testing', 'security automation', 'risk assessment',
      'data protection', 'key management', 'secrets management',
      'zero trust', 'least privilege', 'defense in depth',
      'container security', 'API security', 'DevSecOps'
    ],
    tools: [
      'AWS Security Hub', 'GuardDuty', 'Inspector', 'Macie',
      'CloudTrail', 'Config', 'WAF', 'Shield', 'KMS',
      'Terraform', 'Checkov', 'tfsec', 'Prowler', 'ScoutSuite',
      'Snyk', 'Aqua Security', 'Prisma Cloud', 'Splunk',
      'CrowdStrike', 'Qualys', 'Nessus', 'Burp Suite',
      'OWASP ZAP', 'Vault', 'CyberArk', 'SentinelOne'
    ],
    practices: [
      'NIST framework', 'CIS benchmarks', 'SOC 2', 'ISO 27001',
      'PCI-DSS', 'HIPAA', 'GDPR', 'FedRAMP',
      'shift-left security', 'security as code', 'SIEM',
      'SOAR', 'threat hunting', 'red team', 'blue team',
      'purple team', 'security incident response',
      'vulnerability disclosure', 'bug bounty', 'security audit'
    ],
    cloud_services: [
      'IAM', 'KMS', 'CloudTrail', 'Config', 'GuardDuty',
      'Security Hub', 'Inspector', 'Macie', 'WAF', 'Shield',
      'Firewall Manager', 'Network Firewall', 'VPC Flow Logs',
      'Secrets Manager', 'Certificate Manager', 'SSO',
      'Organizations', 'SCPs', 'RAM', 'PrivateLink',
      'Azure Sentinel', 'Azure Defender', 'GCP Security Command Center'
    ],
    certifications: [
      'AWS Certified Security Specialty',
      'CISSP', 'CCSP', 'CEH',
      'CompTIA Security+', 'CompTIA CySA+',
      'OSCP', 'CISM', 'CISA',
      'AWS Certified Solutions Architect Professional',
      'Google Professional Cloud Security Engineer'
    ]
  },

  'talent-acquisition': {
    title: 'Talent Acquisition Specialist',
    slug: 'talent-acquisition',
    core_skills: [
      'full-cycle recruiting', 'talent acquisition', 'sourcing', 'screening',
      'candidate engagement', 'stakeholder management', 'employer branding',
      'recruitment strategy', 'workforce planning', 'talent pipeline',
      'headhunting', 'campus recruitment', 'lateral hiring', 'volume hiring',
      'offer management', 'salary negotiation', 'candidate experience',
      'diversity hiring', 'employee referral program', 'recruitment marketing',
      'boolean search', 'talent mapping', 'market intelligence',
      'interview coordination', 'onboarding', 'background verification'
    ],
    tools: [
      'Naukri', 'LinkedIn Recruiter', 'Indeed', 'Monster', 'Glassdoor',
      'Workday', 'Taleo', 'iCIMS', 'Greenhouse', 'SuccessFactors',
      'SAP HR', 'BambooHR', 'ATS', 'HRIS', 'MS Office', 'Excel',
      'Zoho Recruit', 'SmartRecruiters', 'JobDiva', 'Bullhorn'
    ],
    practices: [
      'STAR interview method', 'competency-based interviewing',
      'structured interviews', 'behavioral interviewing',
      'talent pool management', 'passive candidate sourcing',
      'data-driven recruiting', 'recruitment analytics',
      'hiring manager partnership', 'employer value proposition',
      'candidate relationship management', 'social recruiting',
      'recruitment compliance', 'equal opportunity hiring',
      'agile recruitment', 'recruitment process outsourcing'
    ],
    cloud_services: [
      'LinkedIn Talent Solutions', 'LinkedIn Insights', 'Naukri RMS',
      'Indeed Sponsored Jobs', 'Glassdoor Employer Account',
      'Google Jobs', 'HackerRank', 'HackerEarth', 'Codility',
      'Microsoft Teams', 'Zoom', 'Google Meet', 'Calendly',
      'DocuSign', 'Power BI', 'Google Analytics'
    ],
    certifications: [
      'SHRM-CP', 'SHRM-SCP', 'PHR', 'SPHR',
      'AIRS Certified Recruiter', 'LinkedIn Certified Recruiter',
      'Talent Acquisition Strategist (TAS)',
      'Certified Internet Recruiter (CIR)',
      'NAPS Certified Personnel Consultant',
      'CIPD Level 5', 'CIPD Level 7'
    ]
  },

  'hr-recruiter': {
    title: 'HR Recruiter',
    slug: 'hr-recruiter',
    core_skills: [
      'recruitment', 'talent acquisition', 'sourcing', 'screening',
      'employee onboarding', 'induction', 'HR administration',
      'employee engagement', 'team management', 'vendor management',
      'cross-functional collaboration', 'stakeholder management',
      'training and development', 'compliance', 'employee retention',
      'interview scheduling', 'candidate assessment', 'reference checks',
      'HR operations', 'performance management', 'exit management',
      'employee documentation', 'background verification', 'MIS reporting',
      'joining formalities', 'HR policies'
    ],
    tools: [
      'Naukri', 'LinkedIn', 'Indeed', 'Monster', 'MS Office',
      'Excel', 'PowerPoint', 'Workday', 'SuccessFactors', 'SAP HR',
      'BambooHR', 'Zoho People', 'GreytHR', 'Darwin Box',
      'Keka HR', 'ATS', 'HRIS', 'Google Suite', 'Outlook'
    ],
    practices: [
      'structured interviews', 'behavioral interviewing',
      'competency mapping', 'manpower planning', 'succession planning',
      'employee lifecycle management', 'HR compliance', 'labor laws',
      'compensation benchmarking', 'employee surveys', 'exit interviews',
      'diversity and inclusion', 'grievance handling',
      'attendance management', 'leave management', 'payroll coordination'
    ],
    cloud_services: [
      'LinkedIn Recruiter', 'Naukri RMS', 'Indeed',
      'Google Meet', 'Microsoft Teams', 'Zoom',
      'Slack', 'HRMS portals', 'DocuSign',
      'Calendly', 'Google Forms', 'MS Forms',
      'SharePoint', 'Power BI', 'Google Sheets'
    ],
    certifications: [
      'SHRM-CP', 'PHR', 'CIPD Level 5',
      'Certified HR Professional',
      'MBA in HR', 'PGDM in HR',
      'Diploma in HR Management',
      'AIRS Certified Recruiter',
      'TA Certification from NIPM',
      'LinkedIn Learning HR Certifications'
    ]
  },

  'platform-engineer': {
    title: 'Platform Engineer',
    slug: 'platform-engineer',
    core_skills: [
      'platform design', 'developer experience', 'internal developer platform',
      'self-service infrastructure', 'automation', 'API design',
      'microservices', 'containerization', 'orchestration', 'CI/CD',
      'Infrastructure as Code', 'cloud-native', 'service mesh',
      'observability', 'scalability', 'multi-tenancy',
      'developer tooling', 'golden paths', 'platform as a product'
    ],
    tools: [
      'Kubernetes', 'Docker', 'Terraform', 'Crossplane', 'Backstage',
      'ArgoCD', 'Flux', 'Helm', 'Kustomize', 'Istio', 'Envoy',
      'Prometheus', 'Grafana', 'OpenTelemetry', 'Vault',
      'GitHub Actions', 'GitLab CI', 'Tekton', 'Harbor',
      'Kyverno', 'OPA', 'Cert-Manager', 'External-DNS',
      'Velero', 'Kafka', 'Redis', 'PostgreSQL', 'Go', 'Python'
    ],
    practices: [
      'GitOps', 'platform engineering', 'developer experience (DevEx)',
      'internal developer portal', 'self-service', 'golden paths',
      'infrastructure abstraction', 'policy as code', 'FinOps',
      'multi-cloud strategy', 'cloud-native patterns',
      'service catalog', 'API-first design', 'event-driven architecture',
      'progressive delivery', 'feature management', 'chaos engineering'
    ],
    cloud_services: [
      'EKS', 'ECS', 'Fargate', 'Lambda', 'API Gateway',
      'ECR', 'S3', 'RDS', 'DynamoDB', 'ElastiCache',
      'CloudWatch', 'X-Ray', 'VPC', 'Transit Gateway',
      'IAM', 'KMS', 'Secrets Manager', 'Service Mesh',
      'GKE', 'AKS', 'Cloud Run', 'Azure Container Apps'
    ],
    certifications: [
      'Certified Kubernetes Administrator (CKA)',
      'Certified Kubernetes Application Developer (CKAD)',
      'Certified Kubernetes Security Specialist (CKS)',
      'AWS Certified DevOps Engineer Professional',
      'HashiCorp Certified Terraform Associate',
      'AWS Certified Solutions Architect Associate',
      'Google Professional Cloud Architect'
    ]
  }
};

/**
 * Get all keywords for a specific role as a flat array.
 * @param {string} roleSlug - The role identifier (e.g., 'aws-devops')
 * @returns {string[]} All keywords combined from all categories
 */
export function getAllKeywords(roleSlug) {
  const role = ROLE_KEYWORDS[roleSlug];
  if (!role) return [];

  return [
    ...role.core_skills,
    ...role.tools,
    ...role.practices,
    ...role.cloud_services,
    ...role.certifications
  ];
}

/**
 * Get keywords organized by category for a specific role.
 * @param {string} roleSlug - The role identifier
 * @returns {Object|null} Keywords organized by category, or null if role not found
 */
export function getKeywordsByCategory(roleSlug) {
  const role = ROLE_KEYWORDS[roleSlug];
  if (!role) return null;

  return {
    core_skills: role.core_skills,
    tools: role.tools,
    practices: role.practices,
    cloud_services: role.cloud_services,
    certifications: role.certifications
  };
}

/**
 * Get list of all available roles.
 * @returns {Array<{slug: string, title: string}>} Array of role objects
 */
export function getAvailableRoles() {
  return Object.entries(ROLE_KEYWORDS).map(([slug, data]) => ({
    slug,
    title: data.title
  }));
}

/**
 * Search for a keyword across all roles.
 * @param {string} keyword - Keyword to search for
 * @returns {Array<{role: string, category: string}>} Roles and categories containing the keyword
 */
export function findKeywordInRoles(keyword) {
  const results = [];
  const lowerKeyword = keyword.toLowerCase();

  for (const [slug, role] of Object.entries(ROLE_KEYWORDS)) {
    const categories = ['core_skills', 'tools', 'practices', 'cloud_services', 'certifications'];
    for (const category of categories) {
      if (role[category].some(k => k.toLowerCase().includes(lowerKeyword))) {
        results.push({ role: slug, category });
      }
    }
  }

  return results;
}

export default ROLE_KEYWORDS;
