export const FEFLOW_ROOT = '.fef';

export const DEVKIT_CONFIG = [
    '.feflowrc.js',
    '.feflowrc.yaml',
    '.feflowrc.yml',
    '.feflowrc.json',
    '.feflowrc',
    'package.json'
];

/**
 * Namespace for collection of "before" hooks
 */
export const HOOK_TYPE_BEFORE = 'before';

/**
 * Namespace for collection of "after" hooks
 */
export const HOOK_TYPE_AFTER = 'after';

/**
 * Emitted when command execution begins
 */
export const EVENT_COMMAND_BEGIN = 'command begin';

/**
 * Emitted when totally finished
 */
export const EVENT_DONE = 'done';