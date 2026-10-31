pipeline {
    agent any

    environment {
        NODE_ENV = 'test'
        IMAGE_FRONTEND = 'sentinel-frontend'
        IMAGE_BACKEND = 'sentinel-backend'
        REGISTRY_TAG = "${env.BUILD_NUMBER}"
    }

    tools {
        nodejs 'NodeJS-20'
    }

    stages {
        stage('Checkout') {
            steps {
                echo '📥 Checking out source code from Git repository...'
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo '📦 Installing Frontend and Backend npm dependencies...'
                sh 'npm ci'
                dir('backend') {
                    sh 'npm ci'
                }
            }
        }

        stage('Automated Tests & Quality') {
            steps {
                echo '🧪 Executing Backend Automated Integration Test Suite...'
                dir('backend') {
                    sh 'npm test'
                }
            }
        }

        stage('Build Artifacts') {
            steps {
                echo '🔨 Compiling Backend TypeScript & Building Frontend Vite Bundle...'
                dir('backend') {
                    sh 'npm run build'
                }
                sh 'npm run build'
            }
        }

        stage('Docker Container Build') {
            steps {
                echo '🐳 Building Multi-Stage Docker Container Images...'
                sh "docker build -t ${IMAGE_BACKEND}:${REGISTRY_TAG} ./backend"
                sh "docker build -t ${IMAGE_FRONTEND}:${REGISTRY_TAG} ."
            }
        }
    }

    post {
        always {
            echo '🧹 Cleaning up workspace...'
            cleanWs()
        }
        success {
            echo '✅ SentinelAI CI Pipeline completed successfully!'
        }
        failure {
            echo '❌ SentinelAI CI Pipeline failed. Please check build logs.'
        }
    }
}
