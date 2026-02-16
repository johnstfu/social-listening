/**
 * RecommendationCard - Carte de recommandation avec menu déroulant
 * Format: Titre, Urgence, Domaine, Date, Description, Progression, Actions checklist
 */

import { useState } from 'react'
import { ChevronDown, ChevronUp, Check, Clock, Users, AlertCircle } from 'lucide-react'

export default function RecommendationCard({ recommendation }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [completedActions, setCompletedActions] = useState(
    recommendation.actions ? recommendation.actions.filter(a => a.completed).map(a => a.id) : []
  )

  const toggleAction = (actionId) => {
    setCompletedActions(prev =>
      prev.includes(actionId)
        ? prev.filter(id => id !== actionId)
        : [...prev, actionId]
    )
  }

  const progress = recommendation.actions
    ? Math.round((completedActions.length / recommendation.actions.length) * 100)
    : 0

  const priorityColors = {
    urgent: { bg: '#FEE2E2', text: '#DC2626', label: 'Urgente' },
    high: { bg: '#FEF3C7', text: '#D97706', label: 'Haute' },
    medium: { bg: '#DBEAFE', text: '#2563EB', label: 'Moyenne' },
    low: { bg: '#D1FAE5', text: '#059669', label: 'Basse' }
  }

  const priority = priorityColors[recommendation.priority] || priorityColors.medium

  return (
    <div style={{
      background: 'white',
      border: '1px solid #E5E7EB',
      borderRadius: '12px',
      overflow: 'hidden',
      marginBottom: '12px'
    }}>
      {/* Header - Always visible */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          padding: '16px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}
      >
        <div style={{ flex: 1 }}>
          <h4 style={{
            margin: '0 0 8px',
            fontSize: '16px',
            fontWeight: 600,
            color: '#111827'
          }}>
            {recommendation.title}
          </h4>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{
              background: priority.bg,
              color: priority.text,
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600
            }}>
              {priority.label}
            </span>

            {recommendation.domain && (
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '13px',
                color: '#6B7280'
              }}>
                <Users size={14} />
                {recommendation.domain}
              </span>
            )}

            {recommendation.date && (
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '13px',
                color: '#6B7280'
              }}>
                <Clock size={14} />
                {recommendation.date}
              </span>
            )}
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginLeft: '16px'
        }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '13px', color: '#6B7280' }}>Progression</span>
            <div style={{
              fontSize: '14px',
              fontWeight: 600,
              color: progress === 100 ? '#059669' : '#3B82F6'
            }}>
              {completedActions.length}/{recommendation.actions?.length || 0}
            </div>
          </div>

          {isExpanded ? (
            <ChevronUp size={20} color="#6B7280" />
          ) : (
            <ChevronDown size={20} color="#6B7280" />
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        height: '4px',
        background: '#F3F4F6',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: '100%',
          width: `${progress}%`,
          background: progress === 100 ? '#059669' : '#3B82F6',
          transition: 'width 0.3s ease'
        }} />
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div style={{
          padding: '16px',
          borderTop: '1px solid #E5E7EB',
          background: '#F9FAFB'
        }}>
          {/* Description */}
          <p style={{
            margin: '0 0 16px',
            fontSize: '14px',
            color: '#4B5563',
            lineHeight: 1.6
          }}>
            {recommendation.description}
          </p>

          {/* Actions checklist */}
          {recommendation.actions && recommendation.actions.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <h5 style={{
                margin: '0 0 12px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#374151'
              }}>
                Actions à réaliser:
              </h5>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recommendation.actions.map((action) => (
                  <div
                    key={action.id}
                    onClick={() => toggleAction(action.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '12px',
                      background: completedActions.includes(action.id) ? '#D1FAE5' : 'white',
                      border: `1px solid ${completedActions.includes(action.id) ? '#059669' : '#E5E7EB'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '4px',
                      border: `2px solid ${completedActions.includes(action.id) ? '#059669' : '#D1D5DB'}`,
                      background: completedActions.includes(action.id) ? '#059669' : 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}>
                      {completedActions.includes(action.id) && (
                        <Check size={14} color="white" strokeWidth={3} />
                      )}
                    </div>
                    <span style={{
                      fontSize: '14px',
                      color: completedActions.includes(action.id) ? '#059669' : '#374151',
                      textDecoration: completedActions.includes(action.id) ? 'line-through' : 'none',
                      lineHeight: 1.5
                    }}>
                      {action.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '12px',
            borderTop: '1px solid #E5E7EB'
          }}>
            <span style={{
              fontSize: '12px',
              color: '#9CA3AF',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <AlertCircle size={12} />
              Source: {recommendation.source || 'Analyse IA'}
            </span>

            <button style={{
              background: progress === 100 ? '#059669' : '#3B82F6',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              {progress === 100 ? (
                <>
                  <Check size={16} />
                  Terminée
                </>
              ) : (
                'Marquer terminée'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
