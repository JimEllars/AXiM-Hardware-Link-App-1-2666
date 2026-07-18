const fs = require('fs');

let content = fs.readFileSync('src/components/OverrideTerminal.jsx', 'utf8');

// Replace imports
content = content.replace(
  "import { sendCommand, getCommandHistory } from '../services/hardwareService';",
  "import { sendCommand, getCommandHistory } from '../services/hardwareService';\nimport { verifyAdminRole, getOperatorIdentity } from '../lib/auth.js';\nimport { aximCoreClient } from '../lib/supabaseClient';"
);

// Remove mock hook
content = content.replace(
  /\/\/ Mock hook for checking user roles.*?(?=export function OverrideTerminal)/s,
  ''
);

// Update component
content = content.replace(
  "export function OverrideTerminal({ deviceId }) {\n  const { isAdmin, loading: authLoading } = useAdminValidation();",
  "export function OverrideTerminal({ deviceId }) {\n  const [isAdmin, setIsAdmin] = useState(false);\n  const [authLoading, setAuthLoading] = useState(true);\n  const [operatorId, setOperatorId] = useState(null);\n\n  useEffect(() => {\n    const initAuth = async () => {\n      try {\n        const roleValid = await verifyAdminRole();\n        setIsAdmin(roleValid);\n        if (roleValid) {\n          const opId = await getOperatorIdentity();\n          setOperatorId(opId);\n        }\n      } catch (err) {\n        setIsAdmin(false);\n      } finally {\n        setAuthLoading(false);\n      }\n    };\n    initAuth();\n  }, []);"
);

// Update handleCommand
const oldHandleCommand = `  const handleCommand = async (e, forcedCmd = null) => {
    if (e) e.preventDefault();
    const cmdInput = (forcedCmd || input).trim();
    if (!cmdInput || isProcessing) return;

    setLogs(prev => [...prev, { id: Date.now(), text: \`> \${cmdInput}\`, type: 'cmd' }]);
    setInput('');
    setIsProcessing(true);

    try {
      const cmdId = await sendCommand(deviceId, cmdInput);
      setPendingCmds(prev => new Set(prev).add(cmdId));

      setLogs(prev => [...prev, {
        id: \`\${cmdId}-pending\`,
        text: \`DISPATCHED: ID [\${cmdId.split('-')[0]}] status: PENDING\`,
        type: 'info'
      }]);
    } catch (err) {
      setLogs(prev => [...prev, {
        id: Date.now(),
        text: \`ERR: Link failure. (\${err.message})\`,
        type: 'error'
      }]);
    } finally {
      setIsProcessing(false);
    }
  };`;

const newHandleCommand = `  const handleCommand = async (e, forcedCmd = null) => {
    if (e) e.preventDefault();
    const cmdInput = (forcedCmd || input).trim();
    if (!cmdInput || isProcessing) return;

    setLogs(prev => [...prev, { id: Date.now(), text: \`> \${cmdInput}\`, type: 'cmd' }]);
    setInput('');
    setIsProcessing(true);

    try {
      // Task 1: Enforce Pre-Flight Session Authorization Checks
      const currentOpId = await getOperatorIdentity();
      const hasAccess = await verifyAdminRole();

      if (!hasAccess) {
        setLogs(prev => [...prev, {
          id: Date.now(),
          text: \`ERROR: [ACCESS_DENIED] Operator context lacks critical clearance parameters.\`,
          type: 'error'
        }]);
        setPendingCmds(new Set());
        return;
      }

      // Task 2: Inject Immutable Global Auditing Records
      const { error: auditError } = await aximCoreClient
        .from('global_audit_logs')
        .insert([{
          operator_id: currentOpId,
          device_id: deviceId,
          command: cmdInput,
          created_at: new Date().toISOString()
        }]);

      if (auditError) {
        throw new Error('Audit log insertion failed: ' + auditError.message);
      }

      const cmdId = await sendCommand(deviceId, cmdInput);
      setPendingCmds(prev => new Set(prev).add(cmdId));

      setLogs(prev => [...prev, {
        id: \`\${cmdId}-pending\`,
        text: \`DISPATCHED: ID [\${cmdId.split('-')[0]}] status: PENDING\`,
        type: 'info'
      }]);
    } catch (err) {
      setLogs(prev => [...prev, {
        id: Date.now(),
        text: \`ERR: Link failure. (\${err.message})\`,
        type: 'error'
      }]);
    } finally {
      setIsProcessing(false);
    }
  };`;

content = content.replace(oldHandleCommand, newHandleCommand);

fs.writeFileSync('src/components/OverrideTerminal.jsx', content);
