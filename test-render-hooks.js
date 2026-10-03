
const React = require('react');
React.useState = (v) => [v, () => {}];
React.useEffect = () => {};
React.useContext = () => ({});
React.useCallback = (f) => f;
React.useMemo = (f) => f();
const childProg = require('./src/components/ChildProgress');
// Can't easily require tsx in vanilla node without Babel/TS setup.
