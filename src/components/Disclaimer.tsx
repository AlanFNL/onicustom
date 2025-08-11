import { motion, AnimatePresence } from 'framer-motion'

interface DisclaimerProps {
  isVisible: boolean
  onClose: () => void
}

export default function Disclaimer({ isVisible, onClose }: DisclaimerProps) {
  return (
    <motion.div
      className="overflow-hidden"
      animate={{ 
        height: isVisible ? 'auto' : 0,
        marginBottom: isVisible ? 32 : 0
      }}
      transition={{ 
        duration: 0.5, 
        ease: [0.32, 0.72, 0, 1] 
      }}
    >
      <AnimatePresence mode="wait">
        {isVisible && (
          <motion.div 
            className="bg-amber-50 border border-amber-200 rounded-2xl p-4 md:p-6 lg:p-8 relative"
            initial={{ 
              opacity: 0, 
              y: 20, 
              scale: 0.95
            }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1
            }}
            exit={{ 
              opacity: 0, 
              y: -20, 
              scale: 0.95
            }}
            transition={{ 
              duration: 0.5, 
              ease: [0.32, 0.72, 0, 1]
            }}
            style={{
              transformOrigin: 'top center'
            }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 0.3,
                delay: 0.1
              }}
            >
              <div className="flex items-start space-x-3 md:space-x-4">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-amber-600 mt-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0 pb-12 md:pb-8">
                  <h3 className="text-base md:text-lg font-medium text-amber-800 mb-2 md:mb-3">
                    INFORMACIÓN IMPORTANTE, ¡POR FAVOR LEÉ!
                  </h3>
                  <div className="space-y-2 md:space-y-3 text-amber-700">
                    <p className="text-xs md:text-sm leading-relaxed">
                      Te recomendamos una imagen de resolución 4K o 300 DPI.
                    </p>
                    <p className="text-xs md:text-sm leading-relaxed">
                      Mantené cualquier imagen o texto importante dentro del <span className="font-medium text-red-600">área roja</span>. Cualquier cosa fuera de esta área puede perderse en el proceso de impresión.
                    </p>
                    <p className="text-xs md:text-sm leading-relaxed">
                      Si no rellenás toda el área de carga y solo llegás hasta la línea verde, el producto final tendrá un borde blanco.
                    </p>
                    <p className="text-xs md:text-sm leading-relaxed font-medium">
                      Subir una imagen de baja calidad resultará en una impresión de baja calidad. Imprimimos lo que nos enviás. No esperés que revisemos tu diseño por calidad.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Close Button - Mobile Bottom, Desktop Top Right */}
            <motion.button
              onClick={onClose}
              className="absolute bottom-3 left-10 md:left-16 px-3 py-1.5 md:px-4 md:py-2 bg-amber-200 text-amber-800 rounded-xl font-medium hover:bg-amber-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 text-sm md:text-base"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              Entendido
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}