package com.example.multitenant.config; //config pacakage

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@Configuration //marks as a spring config class
@EnableAsync //enables spring async support
@EnableScheduling //enables scheduled tasks
public class AsyncConfig implements AsyncConfigurer { 
    //Creates a class named AsyncConfig
    //It implements AsyncConfigurer, which means it can define how async tasks should be handled.
    @Override
    public Executor getAsyncExecutor() { //custom threadpool for async tasks
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor(); //creates thread pool object
        //can run several tasks together
        executor.setCorePoolSize(5); //keeps 5 threads ready 
        executor.setMaxPoolSize(20); //Allows up to 20 threads in the pool when work is heavy.
        executor.setQueueCapacity(50);//If more jobs come in than threads are available, they wait in a queue.
        executor.setThreadNamePrefix("TenantAsync-"); //Names background threads like:
//TenantAsync-1
//TenantAsync-2
//This helps debug and trace which tasks belong to async processing
        executor.setTaskDecorator(new TenantAwareTaskDecorator()); //wraps each task so that tenant information (like current user’s tenant/company) is carried into the background thread.
        executor.initialize();
        return executor;
    }
}
//This class creates a custom background thread pool for Spring. It allows tasks to run asynchronously, keeps a pool of threads ready, limits how many tasks queue up, and ensures tenant context is preserved in background work. This is especially useful in a multi-tenant application where each tenant’s data must stay isolated.
