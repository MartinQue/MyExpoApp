import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface AnimatedAvatarProps {
  isListening?: boolean;
  isSpeaking?: boolean;
  avatarId?: string;
  fullScreen?: boolean;
}

export function AnimatedAvatar({
  isListening = false,
  isSpeaking = false,
  avatarId = 'avatar1',
  fullScreen = false,
}: AnimatedAvatarProps) {
  const [pulseIntensity, setPulseIntensity] = useState(0);

  useEffect(() => {
    if (isSpeaking || isListening) {
      const interval = setInterval(() => {
        setPulseIntensity(Math.random());
      }, 200);
      return () => clearInterval(interval);
    }
  }, [isSpeaking, isListening]);

  const getGradient = () => {
    switch (avatarId) {
      case 'avatar1': return 'from-blue-500 to-purple-500';
      case 'avatar2': return 'from-green-500 to-teal-500';
      case 'avatar3': return 'from-orange-500 to-red-500';
      case 'avatar4': return 'from-purple-500 to-pink-500';
      case 'avatar5': return 'from-cyan-500 to-blue-500';
      default: return 'from-blue-500 to-purple-500';
    }
  };

  const containerSize = fullScreen ? 'w-64 h-64' : 'w-24 h-24';

  return (
    <div className={`relative ${containerSize} flex items-center justify-center`}>
      {/* Outer pulse rings */}
      {(isListening || isSpeaking) && (
        <>
          <motion.div
            className={`absolute inset-0 rounded-full bg-gradient-to-br ${getGradient()} opacity-20`}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0, 0.2],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className={`absolute inset-0 rounded-full bg-gradient-to-br ${getGradient()} opacity-20`}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.2, 0, 0.2],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.5,
            }}
          />
        </>
      )}

      {/* Main avatar circle */}
      <motion.div
        className={`relative ${containerSize} rounded-full bg-gradient-to-br ${getGradient()} shadow-2xl flex items-center justify-center overflow-hidden`}
        animate={{
          scale: isSpeaking ? [1, 1.05, 1] : 1,
        }}
        transition={{
          duration: 0.6,
          repeat: isSpeaking ? Infinity : 0,
          ease: 'easeInOut',
        }}
      >
        {/* Inner glow effect */}
        <motion.div
          className="absolute inset-0 bg-white/20 rounded-full"
          animate={{
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Animated particles when speaking/listening */}
        {(isListening || isSpeaking) && (
          <>
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-white rounded-full"
                style={{
                  top: '50%',
                  left: '50%',
                }}
                animate={{
                  x: [0, Math.cos((i * Math.PI) / 4) * (fullScreen ? 80 : 30)],
                  y: [0, Math.sin((i * Math.PI) / 4) * (fullScreen ? 80 : 30)],
                  opacity: [1, 0],
                  scale: [1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeOut',
                  delay: i * 0.1,
                }}
              />
            ))}
          </>
        )}

        {/* Face elements (simplified anime style) */}
        {fullScreen && (
          <div className="relative z-10">
            {/* Eyes */}
            <div className="flex gap-8 mb-4">
              <motion.div
                className="w-3 h-3 bg-white rounded-full"
                animate={{
                  scaleY: isSpeaking ? [1, 0.3, 1] : 1,
                }}
                transition={{
                  duration: 0.3,
                  repeat: isSpeaking ? Infinity : 0,
                  repeatDelay: 2,
                }}
              />
              <motion.div
                className="w-3 h-3 bg-white rounded-full"
                animate={{
                  scaleY: isSpeaking ? [1, 0.3, 1] : 1,
                }}
                transition={{
                  duration: 0.3,
                  repeat: isSpeaking ? Infinity : 0,
                  repeatDelay: 2,
                }}
              />
            </div>

            {/* Mouth */}
            <motion.div
              className="w-12 h-2 bg-white rounded-full mx-auto"
              animate={{
                scaleX: isSpeaking ? [1, 1.3, 0.9, 1] : 1,
                scaleY: isSpeaking ? [1, 0.8, 1.2, 1] : 1,
              }}
              transition={{
                duration: 0.4,
                repeat: isSpeaking ? Infinity : 0,
                ease: 'easeInOut',
              }}
            />
          </div>
        )}
      </motion.div>

      {/* Status indicator */}
      {!fullScreen && (
        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-lg">
          <motion.div
            className={`w-3 h-3 rounded-full ${
              isListening
                ? 'bg-green-500'
                : isSpeaking
                ? 'bg-blue-500'
                : 'bg-gray-400'
            }`}
            animate={{
              scale: isListening || isSpeaking ? [1, 1.2, 1] : 1,
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>
      )}
    </div>
  );
}
