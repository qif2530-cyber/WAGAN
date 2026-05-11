import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// replace liangshan in UI
content = content.replace(/例如：liangshan/g, '请输入您的私有网关密钥');
content = content.replace(/例如: liangshan/g, '请输入您的私有网关密钥');
content = content.replace(/PROXY_SECRET_KEY \/ liangshan/g, 'PROXY_SECRET_KEY');

// Initial states to use localStorage
const stateInitPassword = `const [password, setPassword] = useState('');`;
const newStateInitPassword = `const [password, setPassword] = useState(() => localStorage.getItem('wagan_password') || '');
  
  useEffect(() => {
    localStorage.setItem('wagan_password', password);
  }, [password]);`;
content = content.replace(stateInitPassword, newStateInitPassword);

const stateInitSettingsPassword = `const [settingsPassword, setSettingsPassword] = useState('');`;
const newStateInitSettingsPassword = `const [settingsPassword, setSettingsPassword] = useState(() => localStorage.getItem('wagan_settings_password') || '');
  
  useEffect(() => {
    localStorage.setItem('wagan_settings_password', settingsPassword);
  }, [settingsPassword]);`;
content = content.replace(stateInitSettingsPassword, newStateInitSettingsPassword);

fs.writeFileSync('src/App.tsx', content);
console.log('App patched');
