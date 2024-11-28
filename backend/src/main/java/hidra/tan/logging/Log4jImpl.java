
package hidra.tan.logging;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.stereotype.Component;

/**
 * Singleton class for logging using Log4j.
 */
@Component
public class Log4jImpl {

    private static final Logger logger = LogManager.getLogger(Log4jImpl.class);

    /**
     * Holder class for lazy-loaded singleton instance.
     */
    private static class Holder {
        private static final Log4jImpl INSTANCE = new Log4jImpl();
    }

    /**
     * Private constructor to prevent instantiation.
     */
    private Log4jImpl() {}

    /**
     * Returns the singleton instance of Log4jImpl.
     *
     * @return the singleton instance
     */
    public static Log4jImpl getInstance() {
        return Holder.INSTANCE;
    }

    /**
     * Logs an info message.
     *
     * @param message the message to log
     */
    public void logInfo(String message) {
        logger.info(message);
    }

    /**
     * Logs an error message.
     *
     * @param message the message to log
     */
    public void logError(String message) {
        logger.error(message);
    }

    /**
     * Logs an error message with an associated throwable.
     *
     * @param message the message to log
     * @param throwable the throwable to log
     */
    public void logError(String message, Throwable throwable) {
        logger.error(message, throwable);
    }
}
