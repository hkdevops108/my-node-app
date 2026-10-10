pipeline {
  agent any

  environment {
    IMAGE_NAME = 'my-node-app'
    IMAGE_TAG  = "${env.BUILD_NUMBER}"
  }

  options {
    disableConcurrentBuilds()
    timestamps()
  }

  stages {
    stage('Install Dependencies') {
      steps {
        sh '''
	  docker run --rm --volumes-from jenkins -w "$WORKSPACE" node:20-alpine npm ci
        '''
      }
    }

    stage('Unit Tests') {
      steps {
        sh '''
	  docker run --rm --volumes-from jenkins -w "$WORKSPACE" node:20-alpine npm test
        '''
      }
    }

    stage('Docker Build') {
      steps {
        sh 'docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .'
      }
    }

    stage('Load Image into Minikube') {
      steps {
        sh 'docker save ${IMAGE_NAME}:${IMAGE_TAG} | docker exec -i minikube ctr -n k8s.io images import -'
      }
    }

    stage('Deploy to Staging') {
      steps {
        withCredentials([file(credentialsId: 'minikube-kubeconfig', variable: 'KUBECONFIG')]) {
          sh '''
            kubectl apply -n staging -f k8s/
            kubectl set image deployment/my-node-app my-node-app=${IMAGE_NAME}:${IMAGE_TAG} -n staging
            kubectl rollout status deployment/my-node-app -n staging --timeout=120s
          '''
        }
      }
    }

    stage('Approval') {
      steps {
        input message: 'Deploy to production?', ok: 'Deploy'
      }
    }

    stage('Deploy to Prod') {
      steps {
        withCredentials([file(credentialsId: 'minikube-kubeconfig', variable: 'KUBECONFIG')]) {
          sh '''
            kubectl apply -n prod -f k8s/
            kubectl set image deployment/my-node-app my-node-app=${IMAGE_NAME}:${IMAGE_TAG} -n prod
            kubectl rollout status deployment/my-node-app -n prod --timeout=120s
          '''
        }
      }
    }
  }

  post {
    success { echo "Pipeline succeeded: ${IMAGE_NAME}:${IMAGE_TAG}" }
    failure { echo 'Pipeline failed. Check the stage logs.' }
  }
}
